import * as vscode from 'vscode';
import * as utilities from '../utilities';
import * as fs from 'fs';

enum State {
    Null = 0,
    Removed,
    Modified,
    Added
}

export function createNode(identifier: string): vscode.Uri {
    return vscode.Uri.parse(`Node:${identifier}`);
}

export class EntryStateDecorationProvider implements vscode.FileDecorationProvider {

    private _disposables: vscode.Disposable[] = [];

    private readonly _onDidChangeDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
    readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[]> = this._onDidChangeDecorations.event;

    private left: vscode.Uri;
    private right: vscode.Uri;

    constructor(left: vscode.Uri, right: vscode.Uri) {
        this.left = left;
        this.right = right;

        this._disposables.push(vscode.window.registerFileDecorationProvider(this));
        console.log("EntryStateDecorationProvider constructed");
    }

    async _getState(uri: vscode.Uri): Promise<State> {
        let left_path = this.left.path.substring(1) + uri.path;
        let right_path = this.right.path.substring(1) + uri.path;

        let left_path_exists = await utilities.exists(left_path);
        let right_path_exists = await utilities.exists(right_path);

        if(!left_path_exists && right_path_exists) {
            return State.Added;
        } else if (left_path_exists && !right_path_exists) {
            return State.Removed;
        } else if (left_path_exists && right_path_exists && Buffer.compare(fs.readFileSync(left_path), fs.readFileSync(right_path))) {
            return State.Modified;
        } else {
            return State.Null;
        }
    }

    private getState(uri: vscode.Uri): State | Thenable<State> {
        return this._getState(uri);
    }

    async updateFileDecoration(uri: vscode.Uri): Promise<void> {
        console.log("updateFileDecoration ", uri.path);
        this._onDidChangeDecorations.fire([uri]);
    }

    async provideFileDecoration(uri: vscode.Uri)/*: vscode.ProviderResult<vscode.FileDecoration>*/ {
        if (uri.scheme != "file-comparator") {
            return null;
        }

        switch (await this.getState(uri)) {
            case State.Null: {
                break;
            }
            case State.Removed: {
                let decoration: vscode.FileDecoration = new vscode.FileDecoration("D", "deleted", new vscode.ThemeColor("foldercomparator.color.deleted"));
                decoration.propagate = true;
                return decoration;
            }
            case State.Modified: {
                let decoration: vscode.FileDecoration =  new vscode.FileDecoration("M", "modified", new vscode.ThemeColor("foldercomparator.color.modified"));
                decoration.propagate = true;
                return decoration;
            }
            case State.Added: {
                let decoration: vscode.FileDecoration =  new vscode.FileDecoration("A", "added", new vscode.ThemeColor("foldercomparator.color.added"));
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