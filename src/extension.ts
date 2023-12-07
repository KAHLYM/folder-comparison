import * as vscode from 'vscode';
import * as fsp from './file-system-provider';
import * as esdp from './entry-state-decorator-provider';
import { execSync } from 'child_process';
import TelemetryReporter from '@vscode/extension-telemetry';
import { isProduction } from './config'

var path = require('path');

let reporter: TelemetryReporter;
const key = isProduction() ? '72789bd2-9cfb-47c9-9308-636866ea5065' : '72789bd2-9cfb-47c9-9308-636866ea5065';

export function activate(context: vscode.ExtensionContext) {

	reporter = new TelemetryReporter(key);
	context.subscriptions.push(reporter);
	reporter.sendTelemetryEvent('activation');

	try {
		execSync('git version');
	} catch (err: any) {
		if (!/\'git\' is not recognized as an internal or external command/.test(err.message || '')) {
			// To protect user privacy, do not send error message in telemetry
			reporter.sendTelemetryErrorEvent('git.version');
			throw err;
		}

		warnAboutMissingGit();
		return;
	}

	let compareFromPath: vscode.Uri;
	let compareToPath: vscode.Uri;

	new esdp.EntryStateDecorationProvider();

	let fileSystemProvider: fsp.FileSystemProvider = new fsp.FileSystemProvider();
	vscode.window.createTreeView('folderComparison', { treeDataProvider: fileSystemProvider });

	vscode.commands.executeCommand('setContext', 'folderComparison.showCompareWithSelected', false);
	vscode.commands.executeCommand('setContext', 'folderComparison.showViewTitles', false);

	let selectForCompare = vscode.commands.registerCommand('folderComparison.selectForCompare', async (uri: vscode.Uri) => {
		reporter.sendTelemetryEvent('command.selectForCompare');
		compareFromPath = uri;
		console.info(`Selection made to compare from '${compareFromPath.path}'`)
		vscode.window.showInformationMessage(`Selected '${path.basename(compareFromPath.path)}' for comparison`);
		vscode.commands.executeCommand('setContext', 'folderComparison.showCompareWithSelected', true);
	});

	let compareWithSelected = vscode.commands.registerCommand('folderComparison.compareWithSelected', async (uri: vscode.Uri) => {
		reporter.sendTelemetryEvent('command.compareWithSelected');
		compareToPath = uri;
		console.info(`Selection made to compare from '${compareFromPath.path}' to '${compareToPath.path}'`)
		vscode.commands.executeCommand('setContext', 'folderComparison.showCompareWithSelected', false);
		vscode.commands.executeCommand('setContext', 'folderComparison.showViewTitles', true);

		fileSystemProvider.update(compareFromPath, compareToPath);
	});

	let openSettings = vscode.commands.registerCommand('folderComparison.openSettings', async () => {
		reporter.sendTelemetryEvent('command.openSettings');
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:KAHLYM.folder-comparison');
	});

	vscode.commands.registerCommand('folderComparison.clear', async () => {
		reporter.sendTelemetryEvent('command.clear');
		fileSystemProvider.clear();
		vscode.commands.executeCommand('setContext', 'folderComparison.showViewTitles', false);
	});

	vscode.commands.registerCommand('folderComparison.refresh', async (telemetry: boolean = true) => {
		// This `folderComparison.refresh` command is called from within `setInterval` and would raise
		// telemetry too frequently. We do not need telemetry on non-user-driven activity so allow 
		// function calls to opt-out of telemetry. If the user were to select the refresh button from
		// the UI, `telemetry` would be `true`.
		if (telemetry) {
			reporter.sendTelemetryEvent('command.refresh');
		}
		fileSystemProvider.refresh();
	});

	context.subscriptions.push(selectForCompare);
	context.subscriptions.push(compareWithSelected);
	context.subscriptions.push(openSettings);

	function setRefreshInterval(): NodeJS.Timer {
		let intervalInSeconds = vscode.workspace.getConfiguration('folderComparison').get<number>('refreshInterval') ?? Number.MAX_SAFE_INTEGER;
		// @ts-ignore
		return setInterval(fileSystemProvider.refresh.bind(fileSystemProvider, false), intervalInSeconds * 1000);
	}

	let refreshInterval = setRefreshInterval();

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration("folderComparison.refreshInterval")) {
			clearInterval(refreshInterval);
			refreshInterval = setRefreshInterval();
		}
	})
}

async function warnAboutMissingGit(): Promise<void> {
	reporter.sendTelemetryEvent('git.warning');
	const download = 'Download Git';
	const choice = await vscode.window.showWarningMessage(
		'Git not found. Please install Git.',
		download
	);

	if (choice === download) {
		reporter.sendTelemetryEvent('git.warning.download');
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://aka.ms/vscode-download-git'));
	} else {
		reporter.sendTelemetryEvent('git.warning.dismiss');
	}
}

export function deactivate() { }
