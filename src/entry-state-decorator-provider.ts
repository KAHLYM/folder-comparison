import * as vscode from 'vscode';
import { Status, stringToStatus } from './git';

export class EntryStateDecorationProvider implements vscode.FileDecorationProvider {

    public _disposables: vscode.Disposable[] = [];

    private readonly _onDidChangeDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
    readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[]> = this._onDidChangeDecorations.event;

    constructor() {
        this._disposables.push(vscode.window.registerFileDecorationProvider(this));
    }

    async _getStatus(uri: vscode.Uri): Promise<Status> {
        return stringToStatus(uri.query);
    }

    private getStatus(uri: vscode.Uri): Status | Thenable<Status> {
        return this._getStatus(uri);
    }

    /* istanbul ignore next: difficult to unit test */
    async updateFileDecoration(uri: vscode.Uri): Promise<void> {
        this._onDidChangeDecorations.fire([uri]);
    }

    async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | null>{
        if (uri.scheme !== "file-comparison") {
            return null;
        }

        switch (await this.getStatus(uri)) {
            case Status.addition: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("A", "addition", new vscode.ThemeColor("folderComparison.color.added"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.deletion: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("D", "deletion", new vscode.ThemeColor("folderComparison.color.deleted"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.modification: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("M", "modification", new vscode.ThemeColor("folderComparison.color.modified"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.rename: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("R", "rename", new vscode.ThemeColor("folderComparison.color.renamed"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.null: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("", "", new vscode.ThemeColor("folderComparison.color.ignored"));
                decoration.propagate = true;
                return decoration;
            }
        }
    }

    /* istanbul ignore next: difficult to unit test */
    dispose() {
        this._disposables.forEach(dispose => dispose.dispose());
    }
}
