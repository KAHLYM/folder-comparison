import * as path from 'path';
import * as utilities from './utilities';
import { Command, TreeItem, Uri, FileType, TreeDataProvider, FileStat, TreeItemCollapsibleState } from 'vscode'
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { diff, NameStatus, Status, statusToString } from './git';
import { FileSystemTrie, FileSystemTrieNode } from './trie';

class FileTreeItem extends TreeItem {
    public left: Uri;
    public right: Uri;
    private subpath: Uri;
    public rightSubpath: Uri;
    public filetype: FileType;
    public status: Status;

    constructor(left: Uri, right: Uri, path: string, filetype: FileType, status: Status) {
        super(path);
        this.left = left;
        this.right = right;
        this.subpath = Uri.parse("file-comparison:///" + path.replaceAll("\\", "/") + "?" + statusToString(status));
        this.rightSubpath = Uri.parse("");
        this.filetype = filetype;
        this.status = status;
    }

    public getUnixSubpath(): string {
        return this.subpath.path.substring(1).replaceAll("\\", "/");
    }

    public setRightSubpath(subpath: string): void {
        this.rightSubpath = Uri.parse("file-comparison:///" + subpath.replaceAll("\\", "/") + "?" + statusToString(this.status));
    }

    public getRightUnixSubpath(): string {
        return this.rightSubpath.path.substring(1).replaceAll("\\", "/");
    }
}

export class FileSystemProvider implements TreeDataProvider<FileTreeItem> {

    private left: Uri;
    private right: Uri;

    private cache: FileSystemTrie;

    constructor(left: Uri, right: Uri) {
        this.left = left;
        this.right = right;

        this.cache = diff(this.left.fsPath, this.right.fsPath);

        this.tmpFile = Uri.file(tmpdir() + "/folder-comparison");
        this.makeTmpFile();
    }

    private toUnix(filepath: string): string {
        return filepath.replaceAll("\\", "/");
    }

    private tmpFile: Uri;
    private makeTmpFile(): void {
        return writeFileSync(this.tmpFile.path.substring(1), "");
    }

    private async _stat(path: string): Promise<FileStat> {
        return new utilities.FileStat(await utilities.stat(path));
    }

    private exists(path: string): boolean | Thenable<boolean> {
        return this._exists(path);
    }

    private async _exists(path: string): Promise<boolean> {
        return utilities.exists(path);
    }

    private readDirectory(directory: string): [string, FileType][] | Thenable<[string, FileType][]> {
        return this._readDirectory(directory);
    }

    private async _readDirectory(directory: string): Promise<[string, FileType][]> {
        const children = await utilities.readdir(directory);

        const result: [string, FileType][] = [];
        for (const child of children) {
            const stat = await this._stat(path.join(directory, child));
            result.push([child, stat.type]);
        }

        return Promise.resolve(result);
    }

    async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        let childCache: Record<string, FileTreeItem> = {};

        if (!element) { // getChildren called against root directory
            const children = await this.readDirectory(this.left.fsPath);
            children.map(([name, type]) => {
                childCache[this.toUnix(name)] = new FileTreeItem(
                    Uri.parse(path.join(this.left.fsPath, name)),
                    Uri.parse(""),
                    name,
                    type,
                    Status.Null);
            });
        } else { // getChildren called against subdirectory
            const subdirectory = path.join(this.left.fsPath, element.getUnixSubpath());
            const exists = await this.exists(subdirectory);
            if (exists) {
                const children = await this.readDirectory(subdirectory);
                children.map(([name, type]) => {
                    let namepath: string = path.join(element.getUnixSubpath(), name);
                    childCache[this.toUnix(namepath)] = new FileTreeItem(
                        Uri.parse(path.join(this.left.fsPath, namepath)),
                        Uri.parse(""),
                        namepath,
                        type,
                        Status.Null);
                });
            }
        }

        // Get elements from cache
        const directory: string = element ? element.getUnixSubpath() : "";
        const items: FileSystemTrieNode[] = this.cache.exists(directory) ? this.cache.getChildren(directory) : [];
        for (const item of items) {
            if (item.key && item.content) {
                const leftSubpath: string = item.content.left.replace(this.right.fsPath.replaceAll("\\", "/"), "").replace(this.left.fsPath.replaceAll("\\", "/"), "").substring(1);
                const rightSubpath: string = item.content.right.replace(this.right.fsPath.replaceAll("\\", "/"), "").substring(1);

                switch (item.content.status) {
                    case Status.Addition:
                        childCache[item.key] = new FileTreeItem(
                            item.content.left,
                            item.content.right,
                            item.key,
                            item.content.filetype,
                            item.content.status
                        );
                        break;
                    case Status.Deletion:
                        childCache[item.key].status = Status.Deletion;
                        break;
                    case Status.Modification:
                        childCache[item.key].status = Status.Modification;
                        break;
                    case Status.Rename:
                        if (childCache[leftSubpath] != undefined) {
                            delete childCache[leftSubpath];
                        } else if (childCache[rightSubpath] != undefined) {
                            childCache[rightSubpath] = new FileTreeItem(
                                item.content.left,
                                item.content.right,
                                rightSubpath,
                                item.content.filetype,
                                item.content.status
                            );
                        }
                        break;
                    case Status.Null:
                        if (childCache[item.key] == undefined) {
                            childCache[item.key] = new FileTreeItem(
                                item.content.left,
                                item.content.right,
                                directory == "" ? item.key : directory + "/" + item.key,
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
            if (a.filetype === b.filetype && a.getUnixSubpath() && b.getUnixSubpath()) {
                return a.getUnixSubpath().localeCompare(b.getUnixSubpath());
            }
            return a.filetype === FileType.Directory ? -1 : 1;
        });

        return children;
    }

    getTreeItem(element: FileTreeItem): TreeItem {
        const resourceUri: Uri = Uri.parse("file-comparison:///" + element.getUnixSubpath() + "?" + statusToString(element.status));
        switch (element.filetype) {
            case FileType.File:
                const treeItem = new TreeItem(resourceUri);
                let command: Command | void = this.getCommand(element);
                if (command) {
                    treeItem.command = command;
                }
                treeItem.contextValue = 'file';
                return treeItem;
            case FileType.Directory:
                return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed);
            default:
                return new TreeItem(resourceUri);
        }
    }

    private getLeftUri(element: FileTreeItem): Uri {
        return Uri.file(this.left.path.substring(1) + "/" + element?.getUnixSubpath());
    }

    private getRightUri(element: FileTreeItem): Uri {
        return Uri.file(this.right.path.substring(1) + "/" + element?.getUnixSubpath())
    }

    private getCommand(element: FileTreeItem): Command | void {
        switch (element.status) {
            case Status.Addition:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this.getRightUri(element),
                    ]
                };
            case Status.Deletion:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this.getLeftUri(element),
                    ]
                };
            case Status.Modification:
                return {
                    command: 'vscode.diff',
                    title: 'Open',
                    arguments: [
                        this.getLeftUri(element),
                        this.getRightUri(element),
                        element.getUnixSubpath() + " (Modified)"
                    ]
                };
            case Status.Rename:
                return {
                    command: 'vscode.open',
                    title: 'Open',
                    arguments: [
                        this.getRightUri(element),
                    ]
                };
        }
    }
}
