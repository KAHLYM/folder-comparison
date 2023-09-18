// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fsp from './view/file-system-provider';

var path = require('path');

export class FileExplorer {
	constructor(left: vscode.Uri, right: vscode.Uri) {
		const treeDataProvider = new fsp.FileSystemProvider(left, right);
		vscode.window.createTreeView('folderComparator', { treeDataProvider });
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "folder-comparator" is now active!');

	let compareFromPath: vscode.Uri;
	let compareToPath: vscode.Uri;

	vscode.commands.executeCommand('setContext', 'folder-comparator.showCompareWithSelected', false);
	vscode.commands.executeCommand('setContext', 'folder-comparator.showView', false);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('folder-comparator.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Folder Comparator!');
	});

	let selectForCompare = vscode.commands.registerCommand('folder-comparator.selectForCompare', async (uri: vscode.Uri) => {
		compareFromPath = uri;
		console.log(`Selection made to compare from '${compareFromPath.path}'`)
		vscode.window.showInformationMessage(`Selected '${path.basename(compareFromPath.path)}' for comparison`);
		vscode.commands.executeCommand('setContext', 'folder-comparator.showCompareWithSelected', true);
		vscode.commands.executeCommand('setContext', 'folder-comparator.showView', false);
	});

	let compareWithSelected = vscode.commands.registerCommand('folder-comparator.compareWithSelected', async (uri: vscode.Uri) => {
		compareToPath = uri;
		console.log(`Selection made to compare from '${compareFromPath.path}' to '${compareToPath.path}'`)
		vscode.commands.executeCommand('setContext', 'folder-comparator.showCompareWithSelected', false);
		vscode.commands.executeCommand('setContext', 'folder-comparator.showView', true);

		new FileExplorer(compareFromPath, compareToPath);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(selectForCompare);
	context.subscriptions.push(compareWithSelected);
}

// This method is called when your extension is deactivated
export function deactivate() { }
