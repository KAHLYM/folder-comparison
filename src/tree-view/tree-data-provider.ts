import { FileSystemTrie, FileSystemTrieNode } from '../data-structures/trie';
import { diff, Status, } from '../git/extract';
import { FileTreeItem } from './tree-item';
import { Command, Event, EventEmitter, FileType, FileStat, TreeDataProvider, TreeItemCollapsibleState, TreeItem, Uri, workspace } from 'vscode';
import * as utilities from '../utilities';
import * as path from 'path';
import { toUnix, makeUri } from '../utilities';

export class FileSystemProvider implements TreeDataProvider<FileTreeItem> {

    public left_: Uri = Uri.parse("");
    public right_: Uri = Uri.parse("");
    public cache_: FileSystemTrie = new FileSystemTrie();

    constructor() { }

    /* istanbul ignore next: not designed for unit test */
    private _onDidChangeTreeData: EventEmitter<FileTreeItem | undefined | null | void> = new EventEmitter<FileTreeItem | undefined | null | void>();
    /* istanbul ignore next: not designed for unit test */
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
        this.cache_ = this.isValid() ? diff(this.left_.fsPath, this.right_.fsPath) : new FileSystemTrie();
        this._onDidChangeTreeData.fire();
    }

    public isValid(): boolean {
        // TODO Fix Uri implementation in regards to consistency
        return this.left_.path !== Uri.parse("").path && this.right_.path !== Uri.parse("").path;
    }

    /* istanbul ignore next: not designed for unit test */
    private async _stat(path: string): Promise<FileStat> {
        return new utilities.FileStat(await utilities.stat(path));
    }

    public exists(path: string): boolean | Thenable<boolean> {
        return this._exists(path);
    }

    /* istanbul ignore next: not designed for unit test */
    private async _exists(path: string): Promise<boolean> {
        return utilities.exists(path);
    }

    public readDirectory(directory: string): [string, FileType][] | Thenable<[string, FileType][]> {
        return this._readDirectory(directory);
    }

    /* istanbul ignore next: not designed for unit test */
    private async _readDirectory(directory: string): Promise<[string, FileType][]> {
        const children = await utilities.readdir(directory);

        const result: [string, FileType][] = [];
        for (const child of children) {
            const stat = await this._stat(path.join(directory, child));
            result.push([child, stat.type]);
        }

        return Promise.resolve(result);
    }

    public removePrefix(path: string, left: boolean, right: boolean): string {
        path = toUnix(path);

        if (right) {
            path = path.replace(toUnix(this.right_.fsPath), "");
        }

        if (left) {
            path = path.replace(toUnix(this.left_.fsPath), "");
        }

        return path.substring(1);
    }

    /* istanbul ignore next: TODO refactor */
    public async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        let childCache: Record<string, FileTreeItem> = {};

        if (!this.isValid()) {
            return [];
        }

        if (!element) { // getChildren called against root directory
            const children = await this.readDirectory(this.left_.fsPath);
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
            const exists = await this.exists(subdirectory);
            if (exists) {
                const children = await this.readDirectory(subdirectory);
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

        // Get elements from cache
        const directory: string = element ? element.subpath : "";
        const items: FileSystemTrieNode[] = this.cache_.exists(directory) ? this.cache_.getChildren(directory) : [];
        for (const item of items) {
            if (item.key && item.content) {
                const leftSubpath: string = this.removePrefix(item.content.left, true, true);
                const rightSubpath: string = this.removePrefix(item.content.right, false, true);

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

        // Sort children by filetype and alphanumerically
        let children: FileTreeItem[] = Object.values(childCache);
        children.sort((a, b) => {
            if (a.filetype === b.filetype && a.subpath && b.subpath) {
                return a.subpath.localeCompare(b.subpath);
            }
            return a.filetype === FileType.Directory ? -1 : 1;
        });

        return children;
    }

    /* istanbul ignore next: TODO refactor */
    public getTreeItem(element: FileTreeItem): TreeItem {
        const resourceUri: Uri = makeUri(element.subpath, element.status);
        switch (element.filetype) {
            case FileType.File:
                const treeItem = new TreeItem(resourceUri);
                let command: Command | void = this._getCommand(element);
                if (command) {
                    treeItem.command = command;
                }
                treeItem.contextValue = 'file';
                return treeItem;
            case FileType.Directory:
                return new TreeItem(resourceUri, this.cache_.exists(element.subpath) ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed);
            default:
                return new TreeItem(resourceUri);
        }
    }

    public _getLeftUri(element: FileTreeItem): Uri {
        return Uri.file(this.left_.path.substring(1) + path.posix.sep + element?.subpath);
    }

    public _getRightUri(element: FileTreeItem): Uri {
        return Uri.file(this.right_.path.substring(1) + path.posix.sep + element?.subpath);
    }

    public _getCommand(element: FileTreeItem): Command | void {
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
