import * as path from 'path';
import { FileTreeItem } from './tree-item';
import { FileSystemTrie, FileSystemTrieNode } from '../data-structures/trie';
import { diff, Status, } from '../git/extract';
import { UriEx } from '../internal/uri';
import { Command, Event, EventEmitter, FileType, TreeDataProvider, TreeItemCollapsibleState, TreeItem, Uri, workspace } from 'vscode';
import { exists, readDirectory }from '../utilities/file-system';
import { toUnix } from '../utilities/path';
import { removePrefixes } from '../utilities/string';

export class FileSystemProvider implements TreeDataProvider<FileTreeItem> {

    public left_: Uri = Uri.parse("");
    public right_: Uri = Uri.parse("");
    public cache_: FileSystemTrie = new FileSystemTrie();

    constructor() { }

    /* istanbul ignore next: difficult to unit test */
    private _onDidChangeTreeData: EventEmitter<FileTreeItem | undefined | null | void> = new EventEmitter<FileTreeItem | undefined | null | void>();
    /* istanbul ignore next: difficult to unit test */
    readonly onDidChangeTreeData: Event<FileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    public clear(): void {
        this.update(Uri.parse(""), Uri.parse(""));
    }

    public update(left: Uri, right: Uri): void {
        this.left_ = left;
        this.right_ = right;
        this.refresh();
    }

    public refresh(): void {
        this.cache_ = this._isValid() ? diff(this.left_.fsPath, this.right_.fsPath) : new FileSystemTrie();
        this._onDidChangeTreeData.fire();
    }

    public _isValid(): boolean {
        // TODO Fix Uri implementation in regards to consistency
        return this.left_.path !== Uri.parse("").path && this.right_.path !== Uri.parse("").path;
    }

    /* istanbul ignore next: difficult to unit test */
    public async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        let childCache: Record<string, FileTreeItem> = {};

        if (this._isValid()) {
            childCache = await this._getChildrenFromDisk(element, childCache);
            childCache = this._getChildrenFromCache(element, childCache);
        }

        return this._sortByFileTypeAndAlphanumeric(Object.values(childCache));
    }

    /* istanbul ignore next: difficult to unit test */
    public async _getChildrenFromDisk(element: FileTreeItem | undefined, childCache: Record<string, FileTreeItem>): Promise<Record<string, FileTreeItem>> {
        if (!element) { // getChildren called against root directory
            const children = await readDirectory(this.left_.fsPath);
            children.map(([name, type]) => {
                if (this.cache_.exists(toUnix(name)) || workspace.getConfiguration('folderComparison').get<boolean>('showUnchanged')) {
                    childCache[toUnix(name)] = new FileTreeItem(
                        Uri.parse(path.join(this.left_.fsPath, name)),
                        Uri.parse(""),
                        name,
                        type,
                        Status.null);
                }
            });
        } else { // getChildren called against subdirectory
            const subdirectory = path.join(this.left_.fsPath, element.subpath);
            const _exists = await exists(subdirectory);
            if (_exists) {
                const children = await readDirectory(subdirectory);
                children.map(([name, type]) => {
                    let namepath: string = path.join(element.subpath, name);
                    if (this.cache_.exists(toUnix(namepath)) || workspace.getConfiguration('folderComparison').get<boolean>('showUnchanged')) {
                        childCache[toUnix(namepath)] = new FileTreeItem(
                            Uri.parse(path.join(this.left_.fsPath, toUnix(namepath))),
                            Uri.parse(""),
                            toUnix(namepath),
                            type,
                            Status.null);
                    }
                });
            }
        }

        return childCache;
    }

    /* istanbul ignore next: TODO */
    public _getChildrenFromCache(element: FileTreeItem | undefined, childCache: Record<string, FileTreeItem>): Record<string, FileTreeItem> {
        const directory: string = element ? element.subpath : "";
        const items: FileSystemTrieNode[] = this.cache_.exists(directory) ? this.cache_.getChildren(directory) : [];
        for (const item of items) {
            if (item.key && item.content) {
                // Use .substring(1) to remove leading path seperator
                const leftSubpath: string = removePrefixes(item.content.left, [this.right_.fsPath, this.left_.fsPath]).substring(1);
                const rightSubpath: string = removePrefixes(item.content.right, [this.right_.fsPath]).substring(1);

                switch (item.content.status) {
                    case Status.addition:
                        childCache[rightSubpath] = new FileTreeItem(
                            item.content.left,
                            item.content.right,
                            directory === "" ? item.key : directory + path.posix.sep + item.key,
                            FileType.File,
                            item.content.status
                        );
                        break;
                    case Status.deletion:
                        childCache[leftSubpath].status = Status.deletion;
                        break;
                    case Status.modification:
                        childCache[leftSubpath].status = Status.modification;
                        break;
                    case Status.rename:
                        if (childCache[leftSubpath] !== undefined) {
                            delete childCache[leftSubpath];
                        } else if (childCache[rightSubpath] !== undefined) {
                            childCache[rightSubpath] = new FileTreeItem(
                                item.content.left,
                                item.content.right,
                                rightSubpath,
                                FileType.File,
                                item.content.status
                            );
                        }
                        break;
                    case Status.null:
                        if (childCache[item.key] === undefined) {
                            childCache[item.key] = new FileTreeItem(
                                item.content.left,
                                item.content.right,
                                directory === "" ? item.key : directory + path.posix.sep + item.key,
                                FileType.Directory,
                                item.content.status
                            );
                        }
                    default:
                        break;

                }
            }
        }

        return childCache;
    }

    /* istanbul ignore next: TODO */
    public _sortByFileTypeAndAlphanumeric(elements: FileTreeItem[]): FileTreeItem[] {
        elements.sort((left, right) => {
            if (left.filetype === right.filetype && left.subpath && right.subpath) {
                return left.subpath.localeCompare(right.subpath);
            }
            return left.filetype === FileType.Directory ? -1 : 1;
        });
        return elements;
    }

    /* istanbul ignore next: TODO */
    public getTreeItem(element: FileTreeItem): TreeItem {
        const uri: UriEx = new UriEx(element.subpath, element.status);
        let treeItem = new TreeItem(uri.getUri());
        switch (element.filetype) {
            case FileType.File:
                treeItem.command = this._getCommand(element);
                treeItem.contextValue = 'file';
                break;
            case FileType.Directory:
                // if exists in cache then change has been made and directory should be expanded
                treeItem.collapsibleState = this.cache_.exists(element.subpath) ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;
                break;
        }
        return treeItem;
    }

    /* istanbul ignore next: TODO */
    public _getLeftUri(element: FileTreeItem): Uri {
        return Uri.file(this.left_.path.substring(1) + path.posix.sep + element?.subpath);
    }

    /* istanbul ignore next: TODO */
    public _getRightUri(element: FileTreeItem): Uri {
        return Uri.file(this.right_.path.substring(1) + path.posix.sep + element?.subpath);
    }

    /* istanbul ignore next: TODO */
    public _getCommand(element: FileTreeItem): Command {
        switch (element.status) {
            case Status.addition:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this._getRightUri(element)
                    ]
                };
            case Status.deletion:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this._getLeftUri(element)
                    ]
                };
            case Status.modification:
                return {
                    command: 'vscode.diff',
                    title: 'Open',
                    arguments: [
                        this._getLeftUri(element),
                        this._getRightUri(element),
                        element.subpath + " (Modified)"
                    ]
                };
            case Status.rename:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this._getRightUri(element),
                    ]
                };
            case Status.null:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this._getLeftUri(element),
                    ]
                };
        }
    }
}
