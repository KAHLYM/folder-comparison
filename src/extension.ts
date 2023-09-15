// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

var path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "folder-comparator" is now active!');

	let compareFromPath: string;
	let compareToPath: string;

	vscode.commands.executeCommand('setContext', 'folder-comparator.showCompareWithSelected', false);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('folder-comparator.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Folder Comparator!');
	});

	let selectForCompare = vscode.commands.registerCommand('folder-comparator.selectForCompare', async (context: vscode.Uri) => {
		compareFromPath = context.path;
		console.log(`Selection made to compare from '${compareFromPath}' to '${compareToPath}'`)
		vscode.window.showInformationMessage(`Selected '${path.basename(compareFromPath)}' for comparison`);
		vscode.commands.executeCommand('setContext', 'folder-comparator.showCompareWithSelected', true);
	});

	let compareWithSelected = vscode.commands.registerCommand('folder-comparator.compareWithSelected', async (context: vscode.Uri) => {
		compareToPath = context.path;
		console.log(`Selection made to compare from '${compareFromPath}' to '${compareToPath}'`)
		vscode.commands.executeCommand('setContext', 'folder-comparator.showCompareWithSelected', false);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(selectForCompare);
	context.subscriptions.push(compareWithSelected);
}

// This method is called when your extension is deactivated
export function deactivate() {}
