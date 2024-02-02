import { Status } from "../git/extract";
import { getTranslationByEnum, getTranslationByString } from "../git/translation";
import { toUnix } from "../utilities/path";
import { Uri } from "vscode";

export class UriEx {
    /**
     * Create an URI given a platform-independant filepath and status.
     * 
     * The internal URI will be of format `file-comparison:<unix-style-filepath>?<status-string>`.
     * E.g. `path\to\file.txt` and `Status.addition` will create a Uri
     * of `file-comparison:path/to/file.txt?addition`
     * 
     * @see {@link Uri.parse}
     * @param filepath The string value of a schema-free Uri.
     * @param status The status in reference to git.
    */
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
