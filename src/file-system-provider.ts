import * as path from 'path';
import * as utilities from './utilities';
import { Command, TreeItem, Uri, FileType, TreeDataProvider, FileStat, TreeItemCollapsibleState } from 'vscode'
import { diff, Status, statusToString } from './git';
import { FileSystemTrie, FileSystemTrieNode } from './trie';

function toUnix(filepath: string): string {
    return filepath.split(path.sep).join(path.posix.sep);
}

function makeUri(filepath: string, status: Status): Uri {
    return Uri.parse("file-comparison:///" + toUnix(filepath) + "?" + statusToString(status));
}

class FileTreeItem extends TreeItem {
    public left: Uri;
    public right: Uri;
    private _subpath: Uri;
    public filetype: FileType;
    public status: Status;

    constructor(left: Uri, right: Uri, path: string, filetype: FileType, status: Status) {
        super(path);
        this.left = left;
        this.right = right;
        this._subpath = makeUri(path, status);
        this.filetype = filetype;
        this.status = status;
    }

    get subpath(): string {
        return toUnix(this._subpath.path).substring(1);
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

    private removePrefix(path: string, left: boolean, right: boolean): string {
        path = toUnix(path);

        if (right) {
            path = path.replace(toUnix(this.right.fsPath), "")
        }

        if (left) {
            path = path.replace(toUnix(this.left.fsPath), "")
        }

        return path.substring(1);
    }

    async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        let childCache: Record<string, FileTreeItem> = {};

        if (!element) { // getChildren called against root directory
            const children = await this.readDirectory(this.left.fsPath);
            children.map(([name, type]) => {
                childCache[toUnix(name)] = new FileTreeItem(
                    Uri.parse(path.join(this.left.fsPath, name)),
                    Uri.parse(""),
                    name,
                    type,
                    Status.Null);
            });
        } else { // getChildren called against subdirectory
            const subdirectory = path.join(this.left.fsPath, element.subpath);
            const exists = await this.exists(subdirectory);
            if (exists) {
                const children = await this.readDirectory(subdirectory);
                children.map(([name, type]) => {
                    let namepath: string = path.join(element.subpath, name);
                    childCache[toUnix(namepath)] = new FileTreeItem(
                        Uri.parse(path.join(this.left.fsPath, toUnix(namepath))),
                        Uri.parse(""),
                        toUnix(namepath),
                        type,
                        Status.Null);
                });
            }
        }

        // Get elements from cache
        const directory: string = element ? element.subpath : "";
        const items: FileSystemTrieNode[] = this.cache.exists(directory) ? this.cache.getChildren(directory) : [];
        for (const item of items) {
            if (item.key && item.content) {
                const leftSubpath: string = this.removePrefix(item.content.left, true, true);
                const rightSubpath: string = this.removePrefix(item.content.right, false, true);

                switch (item.content.status) {
                    case Status.Addition:
                        childCache[item.key] = new FileTreeItem(
                            item.content.left,
                            item.content.right,
                            directory == "" ? item.key : directory + path.posix.sep + item.key,
                            FileType.File,
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
                                FileType.File,
                                item.content.status
                            );
                        }
                        break;
                    case Status.Null:
                        if (childCache[item.key] == undefined) {
                            childCache[item.key] = new FileTreeItem(
                                item.content.left,
                                item.content.right,
                                directory == "" ? item.key : directory + path.posix.sep + item.key,
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

    getTreeItem(element: FileTreeItem): TreeItem {
        const resourceUri: Uri = makeUri(element.subpath, element.status);
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
                return new TreeItem(resourceUri, this.cache.exists(element.subpath) ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed);
            default:
                return new TreeItem(resourceUri);
        }
    }

    private getLeftUri(element: FileTreeItem): Uri {
        return Uri.file(this.left.path.substring(1) + path.posix.sep + element?.subpath);
    }

    private getRightUri(element: FileTreeItem): Uri {
        return Uri.file(this.right.path.substring(1) + path.posix.sep + element?.subpath)
    }

    private getCommand(element: FileTreeItem): Command | void {
        let args: any[] = [];

        switch (element.status) {
            case Status.Addition:
                args = [
                    this.getRightUri(element)
                ];
                break;
            case Status.Deletion:
                args = [
                    this.getLeftUri(element)
                ];
                break;
            case Status.Modification:
                args = [
                    this.getLeftUri(element),
                    this.getRightUri(element),
                    element.subpath + " (Modified)"
                ]
                break;
            case Status.Rename:
                args = [
                    this.getRightUri(element),
                ]
                break;
            case Status.Null:
                args = [
                    this.getLeftUri(element),
                ]
                break;
        }

        return {
            command: 'vscode.open',
            title: 'Open',
            arguments: args
        };
    }
}
