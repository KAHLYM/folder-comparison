import * as path from 'path';
import * as utilities from './utilities';
import { Command, TreeItem, Uri, FileType, TreeDataProvider, FileStat, TreeItemCollapsibleState } from 'vscode'
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { diff, NameStatus, Status, statusToString } from './git';

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

    constructor(left: Uri, right: Uri) {
        this.left = left;
        this.right = right;

        this.cache = {};
        this.populateCache();

        this.tmpFile = Uri.file(tmpdir() + "/folder-comparison");
        this.makeTmpFile();
    }

    private cache: Record<string, FileTreeItem[]>;
    private populateCache(): void {
        const name_statuses: NameStatus[] = diff(this.left.fsPath, this.right.fsPath);
        for (const name_status of name_statuses) {
            const filepath: string = name_status.left ? name_status.left : name_status.right;
            const subpath = this.toUnix(filepath).replace(this.toUnix(this.left.fsPath), "").replace(this.toUnix(this.right.fsPath), "").substring(1);
            const fileTreeItem: FileTreeItem = new FileTreeItem(
                Uri.parse(name_status.left),
                Uri.parse(name_status.right),
                subpath,
                FileType.File,
                name_status.status);

            if (fileTreeItem.status == Status.Rename) {
                const rightFilepath: string = name_status.right;
                const rightSubpath = this.toUnix(rightFilepath).replace(this.toUnix(this.left.fsPath), "").replace(this.toUnix(this.right.fsPath), "").substring(1);
                fileTreeItem.setRightSubpath(rightSubpath);
            }

            // Populate cache with file
            let subpathdir = path.dirname(subpath);
            if (this.cache[subpathdir] == undefined) {
                this.cache[subpathdir] = [fileTreeItem];
            } else {
                this.cache[subpathdir].push(fileTreeItem);
            }

            // Populate cache with right-hand-side parent directories
            let subpathdirs = subpathdir.split("/");
            let subpathdirjoin = "";
            for (var i = 0; i < subpathdirs.length - 1; i++) {
                subpathdirjoin = path.join(subpathdirjoin, subpathdirs[i]);
                const key = this.toUnix(subpathdirjoin);
                const value = new FileTreeItem(
                    Uri.parse(""),
                    Uri.parse(this.toUnix(path.join(this.right.fsPath, key, subpathdirs[i + 1]))),
                    this.toUnix(path.join(key, subpathdirs[i + 1])),
                    FileType.Directory,
                    Status.Null);

                if (this.cache[key] == undefined) {
                    this.cache[key] = [value];
                } else {
                    this.cache[key].push(value);
                }
            }
        }
    }

    private getFileTreeItemsFromCache(directory: string): FileTreeItem[] {
        if (this.cache[directory] != undefined) {
            return this.cache[directory];
        }
        return [];
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
        const directory: string = element ? element.getUnixSubpath() : ".";
        for (const item of this.getFileTreeItemsFromCache(directory)) {
            const itemUnixSubpath: string = item.getUnixSubpath();
            if (childCache[itemUnixSubpath] == undefined) {
                childCache[itemUnixSubpath] = item;
            } else {
                if (item.status == Status.Rename) {
                    childCache[item.getRightUnixSubpath()] = new FileTreeItem(
                        childCache[itemUnixSubpath].left,
                        item.right,
                        item.getRightUnixSubpath(),
                        childCache[itemUnixSubpath].filetype,
                        item.status
                    );
                    delete childCache[itemUnixSubpath];
                } else {
                    childCache[itemUnixSubpath] = new FileTreeItem(
                        childCache[itemUnixSubpath].left,
                        item.right,
                        childCache[itemUnixSubpath].getUnixSubpath(),
                        childCache[itemUnixSubpath].filetype,
                        item.status
                    );
                }
            }
        }

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
                return new TreeItem(resourceUri, TreeItemCollapsibleState.Expanded);
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
