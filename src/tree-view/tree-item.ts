import { Status, } from '../git/extract';
import { FileType, TreeItem, Uri } from 'vscode';
import { toUnix } from '../utilities/path';
import { UriEx } from '../internal/uri';

export class FileTreeItem extends TreeItem {
    public left: Uri;
    public right: Uri;
    public _subpath: UriEx;
    public filetype: FileType;
    public status: Status;

    constructor(left: Uri, right: Uri, path: string, filetype: FileType, status: Status) {
        super(path);
        this.left = left;
        this.right = right;
        this._subpath = new UriEx(path, status);
        this.filetype = filetype;
        this.status = status;
    }

    get subpath(): string {
        return toUnix(this._subpath.getPath()).substring(1);
    }
}
