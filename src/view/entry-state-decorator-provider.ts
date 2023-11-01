import * as vscode from 'vscode';
import { Status, stringToStatus } from '../git';

export function createNode(identifier: string): vscode.Uri {
    return vscode.Uri.parse(`Node:${identifier}`);
}

export class EntryStateDecorationProvider implements vscode.FileDecorationProvider {

    private _disposables: vscode.Disposable[] = [];

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

    async updateFileDecoration(uri: vscode.Uri): Promise<void> {
        this._onDidChangeDecorations.fire([uri]);
    }

    async provideFileDecoration(uri: vscode.Uri) {
        if (uri.scheme != "file-comparison") {
            return null;
        }

        switch (await this.getStatus(uri)) {
            case Status.Addition: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("A", "addition", new vscode.ThemeColor("foldercomparison.color.added"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.Deletion: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("D", "deletion", new vscode.ThemeColor("foldercomparison.color.deleted"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.Modification: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("M", "modification", new vscode.ThemeColor("foldercomparison.color.modified"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.Rename: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("R", "rename", new vscode.ThemeColor("foldercomparison.color.renamed"));
                decoration.propagate = true;
                return decoration;
            }
            case Status.Null: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("", "", new vscode.ThemeColor("foldercomparison.color.ignored"));
                decoration.propagate = true;
                return decoration;
            }
            default: {
                break;
            }
        }

        return null;

    }

    dispose() {
        this._disposables.forEach(dispose => dispose.dispose());
    }
}