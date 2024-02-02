import { Status } from '../git/extract';
import { getTranslationByString } from '../git/translation';
import { Disposable, Event, EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor, Uri, window } from 'vscode';

export class EntryStateDecorationProvider implements FileDecorationProvider {

    public _disposables: Disposable[] = [];

    private readonly _onDidChangeDecorations = new EventEmitter<Uri | Uri[]>();
    readonly onDidChangeFileDecorations: Event<Uri | Uri[]> = this._onDidChangeDecorations.event;

    constructor() {
        this._disposables.push(window.registerFileDecorationProvider(this));
    }

    async _getStatus(uri: Uri): Promise<Status> {
        return getTranslationByString(uri.query).status;
    }

    private getStatus(uri: Uri): Status | Thenable<Status> {
        return this._getStatus(uri);
    }

    /* istanbul ignore next: difficult to unit test */
    async updateFileDecoration(uri: Uri): Promise<void> {
        this._onDidChangeDecorations.fire([uri]);
    }

    async provideFileDecoration(uri: Uri): Promise<FileDecoration | null>{
        if (uri.scheme !== "file-comparison") {
            return null;
        }

        switch (await this.getStatus(uri)) {
            case Status.addition: {
                let decoration: FileDecoration = new FileDecoration("A", "addition", new ThemeColor("folderComparison.color.added"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.deletion: {
                let decoration: FileDecoration = new FileDecoration("D", "deletion", new ThemeColor("folderComparison.color.deleted"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.modification: {
                let decoration: FileDecoration = new FileDecoration("M", "modification", new ThemeColor("folderComparison.color.modified"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.rename: {
                let decoration: FileDecoration = new FileDecoration("R", "rename", new ThemeColor("folderComparison.color.renamed"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.null: {
                let decoration: FileDecoration = new FileDecoration("", "", new ThemeColor("folderComparison.color.ignored"));
                decoration.propagate = true;
                return decoration;
            }
        }
    }

    /* istanbul ignore next: TODO */
    dispose() {
        this._disposables.forEach(dispose => dispose.dispose());
    }
}
