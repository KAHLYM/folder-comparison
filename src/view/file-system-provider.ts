import * as path from 'path';
import * as utilities from '../utilities';
import { TreeItem, Uri, FileType, TreeDataProvider, FileStat, TreeItemCollapsibleState } from 'vscode'

enum Root {
    Left = 1,
    Right = 2,
}

interface Entry { 
    uri: Uri;
    type: FileType;
    root: Root;
    subpath: string;
}

export class FileSystemProvider implements TreeDataProvider<Entry> {

    private left: Uri;
    private right: Uri;

    constructor(left: Uri, right: Uri) {
        this.left = left;
        this.right = right;
    }

    stat(uri: Uri): FileStat | Thenable<FileStat> {
        return this._stat(uri.fsPath);
    }

    async _stat(path: string): Promise<FileStat> {
        return new utilities.FileStat(await utilities.stat(path));
    }

    readDirectory(directory: string): [string, FileType][] | Thenable<[string, FileType][]> {
        return this._readDirectory(directory);
    }

    async _readDirectory(directory: string): Promise<[string, FileType][]> {
        const children = await utilities.readdir(directory);

        const result: [string, FileType][] = [];
        for (const child of children) {
            const stat = await this._stat(path.join(directory, child));
            result.push([child, stat.type]);
        }

        return Promise.resolve(result);
    }

    readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
        return utilities.readfile(uri.fsPath);
    }

    makeUri(filepath: string): Uri {
        return Uri.parse("file-comparator:///" + filepath.replace("\\", "/"));
    }

    async getChildren(element?: Entry): Promise<Entry[]> {
        let cache: Record<string, Entry> = {};
        let entries: Entry[] = [];

        if (element) {
            if (element.root & Root.Left) {
                const children = await this.readDirectory(path.join(this.left.fsPath, element.subpath));
                children.map(([name, type]) => {
                    let namepath: string = path.join(element.subpath, name);
                    cache[name] = { uri: this.makeUri(namepath), type: type, root: Root.Left, subpath: namepath };
                });
            }
            
            if (element.root & Root.Right) {
                const children = await this.readDirectory(path.join(this.right.fsPath, element.subpath));
                children.map(([name, type]) => {
                    if (cache[name] != undefined) {
                        cache[name].root |= Root.Right;
                    } else {
                    let namepath: string = path.join(element.subpath, name);
                    cache[name] = { uri: this.makeUri(namepath), type: type, root: Root.Right, subpath: namepath };
                    }
                });
            }
        } else { // getChildren called against root directories
            if (this.left) {
                const children = await this.readDirectory(this.left.fsPath);
                children.map(([name, type]) => {
                    cache[name] = { uri: this.makeUri(name), type: type, root: Root.Left, subpath: name };
                });
            }

            if (this.right) {
                const children = await this.readDirectory(this.right.fsPath);
                children.map(([name, type]) => {
                    if (cache[name] != undefined) {
                        cache[name].root |= Root.Right;
                    } else {
                        cache[name] = { uri: this.makeUri(name), type: type, root: Root.Right, subpath: name };
                    }
                });
            }
        }

        entries = Object.values(cache); 
        entries.sort((a, b) => {
            if (a.type === b.type) {
                return a.uri.path.localeCompare(b.uri.path);
            }
            return a.type === FileType.Directory ? -1 : 1;
        });

        for (const entry of entries) {
            console.log("getChildren", entry.uri.path);
        }

        return entries;
    }

    getTreeItem(element: Entry): TreeItem {
        const treeItem = new TreeItem(element.uri, element.type === FileType.Directory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
        if (element.type === FileType.File) {
            treeItem.contextValue = 'file';
        }
        return treeItem;
    }
}
