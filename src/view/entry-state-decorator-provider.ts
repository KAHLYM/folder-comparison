import * as vscode from 'vscode';

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

    constructor() {
        this._disposables.push(vscode.window.registerFileDecorationProvider(this));
        console.log("EntryStateDecorationProvider constructed");
    }

    getState(uri: vscode.Uri): State {
        if (uri.path.endsWith(".txt")) {
            return State.Modified;
        } else if(uri.path.endsWith(".md")) {
            return State.Added;
        } else {
            return State.Null;
        }
    }

    async updateFileDecoration(uri: vscode.Uri): Promise<void> {
        console.log("updateActiveEditor entered with uri ", uri);
        this._onDidChangeDecorations.fire([uri]);
    }

    provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
        if (uri.scheme != "file-comparator") {
            return null;
        }

        switch (this.getState(uri)) {
            case State.Null: {
                break;
            }
            case State.Removed: {
                return new vscode.FileDecoration("D", "deleted", new vscode.ThemeColor("foldercomparator.color.deleted"));
            }
            case State.Modified: {
                return new vscode.FileDecoration("M", "modified", new vscode.ThemeColor("foldercomparator.color.modified"));
            }
            case State.Added: {
                return new vscode.FileDecoration("A", "added", new vscode.ThemeColor("foldercomparator.color.added"));
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