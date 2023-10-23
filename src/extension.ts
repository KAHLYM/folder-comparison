import * as vscode from 'vscode';
import * as fsp from './view/file-system-provider';
import * as esdp from './view/entry-state-decorator-provider';

var path = require('path');

export class FileExplorer {
	constructor(left: vscode.Uri, right: vscode.Uri) {
		const treeDataProvider = new fsp.FileSystemProvider(left, right);
		vscode.window.createTreeView('folderComparison', { treeDataProvider });
		new esdp.EntryStateDecorationProvider(left, right);
	}
}

export function activate(context: vscode.ExtensionContext) {

	let compareFromPath: vscode.Uri;
	let compareToPath: vscode.Uri;

	vscode.commands.executeCommand('setContext', 'folder-comparison.showCompareWithSelected', false);
	vscode.commands.executeCommand('setContext', 'folder-comparison.showView', false);

	let selectForCompare = vscode.commands.registerCommand('folder-comparison.selectForCompare', async (uri: vscode.Uri) => {
		compareFromPath = uri;
		console.log(`Selection made to compare from '${compareFromPath.path}'`)
		vscode.window.showInformationMessage(`Selected '${path.basename(compareFromPath.path)}' for comparison`);
		vscode.commands.executeCommand('setContext', 'folder-comparison.showCompareWithSelected', true);
		vscode.commands.executeCommand('setContext', 'folder-comparison.showView', false);
	});

	let compareWithSelected = vscode.commands.registerCommand('folder-comparison.compareWithSelected', async (uri: vscode.Uri) => {
		compareToPath = uri;
		console.log(`Selection made to compare from '${compareFromPath.path}' to '${compareToPath.path}'`)
		vscode.commands.executeCommand('setContext', 'folder-comparison.showCompareWithSelected', false);
		vscode.commands.executeCommand('setContext', 'folder-comparison.showView', true);

		new FileExplorer(compareFromPath, compareToPath);
	});

	context.subscriptions.push(selectForCompare);
	context.subscriptions.push(compareWithSelected);
}

export function deactivate() { }
