import * as path from 'path';
import * as utilities from '../utilities';
import { TreeItem, Uri, FileType, TreeDataProvider, FileStat, TreeItemCollapsibleState } from 'vscode'

enum Root {
    Left = 1,
    Right = 2,
}

class FileTreeItem extends TreeItem { 
    public filetype: FileType;
    public root: Root;
    public subpath: string;

    constructor(resourceUri: Uri, filetype: FileType, root: Root, subpath: string) {
        super(resourceUri);
        this.filetype = filetype;
        this.root = root;
        this.subpath = subpath;
    }
}

export class FileSystemProvider implements TreeDataProvider<FileTreeItem> {

    private left: Uri;
    private right: Uri;

    constructor(left: Uri, right: Uri) {
        this.left = left;
        this.right = right;
    }

    private async _stat(path: string): Promise<FileStat> {
        return new utilities.FileStat(await utilities.stat(path));
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

    makeUri(filepath: string): Uri {
        return Uri.parse("file-comparator:///" + filepath.replace("\\", "/"));
    }

    async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        let cache: Record<string, FileTreeItem> = {};
        let entries: FileTreeItem[] = [];

        if (element) {
            if (element.root & Root.Left) {
                const children = await this.readDirectory(path.join(this.left.fsPath, element.subpath));
                children.map(([name, type]) => {
                    let namepath: string = path.join(element.subpath, name);
                    cache[name] = new FileTreeItem(this.makeUri(namepath), type, Root.Left, namepath);
                });
            }
            
            if (element.root & Root.Right) {
                const children = await this.readDirectory(path.join(this.right.fsPath, element.subpath));
                children.map(([name, type]) => {
                    if (cache[name] != undefined) {
                        cache[name].root |= Root.Right;
                    } else {
                    let namepath: string = path.join(element.subpath, name);
                    cache[name] = new FileTreeItem(this.makeUri(namepath), type, Root.Right, namepath);
                    }
                });
            }
        } else { // getChildren called against root directories
            if (this.left) {
                const children = await this.readDirectory(this.left.fsPath);
                children.map(([name, type]) => {
                    cache[name] = new FileTreeItem(this.makeUri(name), type, Root.Left, name);
                });
            }

            if (this.right) {
                const children = await this.readDirectory(this.right.fsPath);
                children.map(([name, type]) => {
                    if (cache[name] != undefined) {
                        cache[name].root |= Root.Right;
                    } else {
                        cache[name] = new FileTreeItem(this.makeUri(name), type, Root.Right, name);
                    }
                });
            }
        }

        entries = Object.values(cache); 
        entries.sort((a, b) => {
            if (a.filetype === b.filetype && a.resourceUri && b.resourceUri) {
                return a.resourceUri.path.localeCompare(b.resourceUri.path);
            }
            return a.filetype === FileType.Directory ? -1 : 1;
        });

        return entries;
    }

    getTreeItem(element: FileTreeItem): TreeItem {
        if (element.resourceUri) {
            const treeItem = new TreeItem(element.resourceUri, element.filetype === FileType.Directory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
            if (element.filetype === FileType.File) {
                treeItem.contextValue = 'file';
            }
            return treeItem;
        }

        const treeItem = new TreeItem("<unresolved-uri>")
        return treeItem;
    }
}
