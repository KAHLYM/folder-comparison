import * as vscode from 'vscode';
import * as fsp from './tree-view/tree-data-provider';
import * as esdp from './tree-view/file-decoration-provider';
import { execSync } from 'child_process';
import TelemetryReporter from '@vscode/extension-telemetry';
import { isProduction } from './config';
import { logger } from './utilities/logger';
import { randomUUID } from 'crypto';
import { extract } from './utilities/unzip';

const fs = require('fs');
const os = require('os');
const path = require('path');

let reporter: TelemetryReporter;
const key = isProduction() ? 'c6ac3418-0023-4e5a-9d3b-bdc4a81e6c53' : '8fce904f-cf3a-4160-9107-82c024e9c258';

export function activate(context: vscode.ExtensionContext) {

	reporter = new TelemetryReporter(key);
	context.subscriptions.push(reporter);
	reporter.sendTelemetryEvent('activation');
	logger.info(`Activated extension`);

	try {
		execSync('git version');
	} catch (err: any) {
		if (!/\'git\' is not recognized as an internal or external command/.test(err.message || '')) {
			// To protect user privacy, do not send error message in telemetry
			reporter.sendTelemetryErrorEvent('git.version');
			logger.error(`Unknown git output: ${err.message}`);
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
		logger.info(`Selection made to compare from '${compareFromPath.path}'`);

		vscode.window.showInformationMessage(`Selected '${path.basename(compareFromPath.path)}' for comparison`);
		vscode.commands.executeCommand('setContext', 'folderComparison.showCompareWithSelected', true);
	});

	let compareWithSelected = vscode.commands.registerCommand('folderComparison.compareWithSelected', async (uri: vscode.Uri) => {
		reporter.sendTelemetryEvent('command.compareWithSelected');

		compareToPath = uri;
		logger.info(`Selection made to compare from '${compareFromPath.path}' to '${compareToPath.path}'`);

		vscode.commands.executeCommand('setContext', 'folderComparison.showCompareWithSelected', false);
		vscode.commands.executeCommand('setContext', 'folderComparison.showViewTitles', true);

		if (vscode.workspace.getConfiguration('folderComparison').get<boolean>('extractCompressed')) {
			const extractedCompareFromPath = compareFromPath.fsPath.endsWith(".zip") ? extractCompressed(compareFromPath) : Promise.resolve(compareFromPath);
			const extractedCompareToPath = compareToPath.fsPath.endsWith(".zip") ? extractCompressed(compareToPath) : Promise.resolve(compareToPath);
			await Promise.all([extractedCompareFromPath, extractedCompareToPath]).then(uris => {
				compareFromPath = uris[0];
				compareToPath = uris[1];
			});
		}

		fileSystemProvider.update(compareFromPath, compareToPath);
	});

	let openSettings = vscode.commands.registerCommand('folderComparison.openSettings', async () => {
		reporter.sendTelemetryEvent('command.openSettings');
		logger.debug(`Command issued to open settings`);

		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:KAHLYM.folder-comparison');
	});

	vscode.commands.registerCommand('folderComparison.clear', async () => {
		reporter.sendTelemetryEvent('command.clear');
		logger.debug(`Command issued to clear`);

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
			logger.debug(`Command issued to refresh`);
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
		if (event.affectsConfiguration("folderComparison.view.refreshInterval")) {
			clearInterval(refreshInterval);
			refreshInterval = setRefreshInterval();
		} else if (event.affectsConfiguration("folderComparison.debug.logLevel")) {
			const logLevel = vscode.workspace.getConfiguration('folderComparison').get<string>('logLevel') ?? logger.defaultLevel;
			logger.info(`User configured log level to be ${logLevel}`);
			logger.setLogLevel(logLevel);
		} else if (event.affectsConfiguration("folderComparison.view.showUnchanged")) {
			fileSystemProvider.refresh();
		}
	});
}

async function warnAboutMissingGit(): Promise<void> {
	reporter.sendTelemetryEvent('git.warning');
	logger.warning(`Git is missing`);

	const download = 'Download Git';
	const choice = await vscode.window.showWarningMessage(
		'Git not found. Please install Git.',
		download
	);

	if (choice === download) {
		reporter.sendTelemetryEvent('git.warning.download');
		logger.debug(`User selected to download Git`);

		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://aka.ms/vscode-download-git'));
	} else {
		reporter.sendTelemetryEvent('git.warning.dismiss');
		logger.debug(`User selected to dismiss Git`);
	}
}

async function extractCompressed(filepath: vscode.Uri): Promise<vscode.Uri> {
	const directory = path.join(os.tmpdir(), randomUUID());
	fs.mkdirSync(directory);
	const copiedFilePath = path.join(directory, path.parse(filepath.path).base);

	fs.cpSync(filepath.fsPath, copiedFilePath, { recursive: true });
	await extract(copiedFilePath);

	return  vscode.Uri.file(copiedFilePath.substring(0, copiedFilePath.lastIndexOf('.')));
}

export function deactivate() { }
