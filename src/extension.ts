import * as vscode from 'vscode';
import * as fsp from './file-system-provider';
import * as esdp from './entry-state-decorator-provider';
import { execSync } from 'child_process';

var path = require('path');

export class FileExplorer {
	constructor(left: vscode.Uri, right: vscode.Uri) {
		const treeDataProvider = new fsp.FileSystemProvider(left, right);
		vscode.window.createTreeView('folderComparison', { treeDataProvider });
		new esdp.EntryStateDecorationProvider();
	}
}

export function activate(context: vscode.ExtensionContext) {

	try {
		execSync('git version');
	} catch (err: any) {
		if (!/\'git\' is not recognized as an internal or external command/.test(err.message || '')) {
			throw err;
		}

		warnAboutMissingGit();
		return;
	}
	
	let compareFromPath: vscode.Uri;
	let compareToPath: vscode.Uri;

	vscode.commands.executeCommand('setContext', 'folder-comparison.showCompareWithSelected', false);
	vscode.commands.executeCommand('setContext', 'folder-comparison.showView', false);

	let selectForCompare = vscode.commands.registerCommand('folder-comparison.selectForCompare', async (uri: vscode.Uri) => {
		compareFromPath = uri;
		console.info(`Selection made to compare from '${compareFromPath.path}'`)
		vscode.window.showInformationMessage(`Selected '${path.basename(compareFromPath.path)}' for comparison`);
		vscode.commands.executeCommand('setContext', 'folder-comparison.showCompareWithSelected', true);
		vscode.commands.executeCommand('setContext', 'folder-comparison.showView', false);
	});

	let compareWithSelected = vscode.commands.registerCommand('folder-comparison.compareWithSelected', async (uri: vscode.Uri) => {
		compareToPath = uri;
		console.info(`Selection made to compare from '${compareFromPath.path}' to '${compareToPath.path}'`)
		vscode.commands.executeCommand('setContext', 'folder-comparison.showCompareWithSelected', false);
		vscode.commands.executeCommand('setContext', 'folder-comparison.showView', true);

		new FileExplorer(compareFromPath, compareToPath);
	});

	context.subscriptions.push(selectForCompare);
	context.subscriptions.push(compareWithSelected);
}

async function warnAboutMissingGit(): Promise<void> {
	const download = 'Download Git';
	const choice = await vscode.window.showWarningMessage(
		'Git not found. Please install Git.',
		download
	);

	if (choice === download) {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://aka.ms/vscode-download-git'));
	}
}

export function deactivate() { }
