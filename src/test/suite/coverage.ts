import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';


export async function run(): Promise<void> {
	const cwd = path.join(__dirname, '..', '..', '..');

	const NYC = require('nyc');
	const nyc = new NYC({
		cwd: cwd,
		reporter: ['text', 'html'],
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
		include: ["out/**/*.js"],
		exclude: ["out/test/**"],
		require: ['ts-node/register', 'source-map-support/register'],
	});
	await nyc.reset();
	await nyc.wrap();

	Object.keys(require.cache).filter(f => nyc.exclude.shouldInstrument(f)).forEach(modules => {
		console.warn('Module(s) loaded before NYC, invalidating:', modules);
		delete require.cache[modules];
		require(modules);
	});

	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '..');
	const testFiles = glob.sync('**/*.test.js', { cwd: testsRoot });
	testFiles.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

	await new Promise(resolve => mocha.run(resolve));
	await nyc.writeCoverageFile();
	await nyc.report();

	// The error raised within `nyc.checkCoverage` does not propagate.
	// The implemented workaround is to parse the index.html generated through `nyc.writeCoverageFile`,
	// and throw an error if global coverage metrics do not meet specified thresholds.

	const threshold = {
		"branches": 90,
		"lines": 90,
		"functions": 90,
		"statements": 90
	};

	const fs = require("fs");
	const data = fs.readFileSync(path.join(cwd, 'coverage', 'index.html'), 'utf8');

	const jsdom = require("jsdom");
	const { JSDOM } = jsdom;
	const dom = new JSDOM(data);

	const statements: number = parseInt(dom.window.document.querySelector("body > div.wrapper > div:nth-child(1) > div.clearfix > div:nth-child(1) > span.strong").textContent.split("%")[0]);
	if (statements < threshold["statements"]) {
		throw Error(`Coverage for statements (${statements}%) does not meet global threshold (${threshold["statements"]}%)`);
	}

	const branches: number = parseInt(dom.window.document.querySelector("body > div.wrapper > div:nth-child(1) > div.clearfix > div:nth-child(2) > span.strong").textContent.split("%")[0]);
	if (branches < threshold["branches"]) {
		throw Error(`Coverage for branches (${branches}%) does not meet global threshold (${threshold["branches"]}%)`);
	}

	const functions: number = parseInt(dom.window.document.querySelector("body > div.wrapper > div:nth-child(1) > div.clearfix > div:nth-child(3) > span.strong").textContent.split("%")[0]);
	if (functions < threshold["functions"]) {
		throw Error(`Coverage for functions (${functions}%) does not meet global threshold (${threshold["functions"]}%)`);
	}

	const lines: number = parseInt(dom.window.document.querySelector("body > div.wrapper > div:nth-child(1) > div.clearfix > div:nth-child(4) > span.strong").textContent.split("%")[0]);
	if (lines < threshold["lines"]) {
		throw Error(`Coverage for lines (${lines}%) does not meet global threshold (${threshold["lines"]}%)`);
	}

	let filenames: string[] = [];
	[...dom.window.document.getElementsByClassName("file")].forEach(function (element: any) {
		if (element.getAttribute("data-value")) {
			filenames.push(element.getAttribute("data-value"));
		}
	});

	const skipFiles = [
		'config.ts',
		'extension.ts',
		'file-system-provider.ts'];
	filenames = filenames.concat(skipFiles);

	const gitDirectory = path.join(__dirname, '..', '..', '..', 'src');
	const sourceFiles = glob.sync('*.ts', { cwd: gitDirectory });
	const untestedFiles = sourceFiles.filter((file) => !filenames.includes(file));
	if (0 < untestedFiles.length) {
		throw Error(`Coverage does not exist for ${untestedFiles.join(', ')}`);
	}
}
