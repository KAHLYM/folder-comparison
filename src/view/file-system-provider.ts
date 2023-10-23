import * as path from 'path';
import * as utilities from '../utilities';
import { Command, TreeItem, Uri, FileType, TreeDataProvider, FileStat, TreeItemCollapsibleState } from 'vscode'
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';

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

    private tmpFile: Uri;

    constructor(left: Uri, right: Uri) {
        this.left = left;
        this.right = right;

        this.tmpFile = Uri.file(tmpdir() + "/folder-comparison");
        this.makeTmpFile();
    }

    private makeTmpFile(): void {
        return writeFileSync(this.tmpFile.path.substring(1), "");
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
        return Uri.parse("file-comparison:///" + filepath.replaceAll("\\", "/"));
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
        const resourceUri: Uri = element && element.resourceUri ? element.resourceUri : Uri.parse("<unresolved-uri>");
        switch (element.filetype) {
            case FileType.File:
                const treeItem = new TreeItem(resourceUri)
                treeItem.command = this.getCommand(element);
                treeItem.contextValue = 'file';
                return treeItem;
            case FileType.Directory:
                return new TreeItem(resourceUri, TreeItemCollapsibleState.Expanded);
            default:
                return new TreeItem(resourceUri);
        }
    }

    private getLeftUri(element: FileTreeItem): Uri {
        return Uri.file(this.left.path.substring(1) + "/" + element?.subpath.replaceAll("\\", "/"))
    }

    private getRightUri(element: FileTreeItem): Uri {
        return Uri.file(this.right.path.substring(1) + "/" + element?.subpath.replaceAll("\\", "/"))
    }

    private getCommand(element: FileTreeItem): Command {
        const title = element.subpath;
        return {
            command: 'vscode.diff',
            title: 'Open',
            arguments: [
                element.root & Root.Left ? this.getLeftUri(element) : this.tmpFile,
                element.root & Root.Right ? this.getRightUri(element) : this.tmpFile,
                title
            ]
        };
    }
}
