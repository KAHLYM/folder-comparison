import { Status, } from '../git/extract';
import { FileType, TreeItem, Uri } from 'vscode';
import { toUnix, makeUri } from '../utilities';

export class FileTreeItem extends TreeItem {
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
