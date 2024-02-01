import { Status } from "../git/extract";
import { getTranslationByEnum, getTranslationByString } from "../git/translation";
import { toUnix } from "../utilities/path";
import { Uri } from "vscode";

export class UriEx {
    constructor(filepath: string, status: Status) {
        this._uri = Uri.parse("file-comparison:" + toUnix(filepath) + "?" + getTranslationByEnum(status).string);
    }

    public getPath(): string {
        return this._uri.path;
    }

    public getStatus(): Status {
        return getTranslationByString(this._uri.query).status;
    }

    public getUri(): Uri {
        return this._uri;
    }

    public _uri: Uri;
}
