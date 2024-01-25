import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';


export async function run(): Promise<void> {
	const cwd = path.join(__dirname, '..', '..', '..');

	const NYC = require('nyc');
	const nyc = new NYC({
		cwd: cwd,
		reporter: ['text', 'html', 'json-summary'],
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
		include: ["out/**/*.js"],
		exclude: ["out/test/**", "out/**/*.test.js"],
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

	const srcRoot = path.resolve(__dirname, '..', '..');
	const testFiles = glob.sync('**/*.test.js', { cwd: srcRoot });
	testFiles.forEach(f => mocha.addFile(path.resolve(srcRoot, f)));

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

	const fs = require('fs');
	fs.readFile(path.join(cwd, 'coverage', 'coverage-summary.html'), 'utf8', function (err: any, data: any) {
		if (err) {
			throw err;
		}
		const obj = JSON.parse(data);

		const statements: number = parseInt(obj["total"]["statements"]["pct"]);
		if (statements < threshold["statements"]) {
			throw Error(`Coverage for statements (${statements}%) does not meet global threshold (${threshold["statements"]}%)`);
		}

		const branches: number = parseInt(obj["total"]["branches"]["pct"]);
		if (branches < threshold["branches"]) {
			throw Error(`Coverage for branches (${branches}%) does not meet global threshold (${threshold["branches"]}%)`);
		}

		const functions: number = parseInt(obj["total"]["functions"]["pct"]);
		if (functions < threshold["functions"]) {
			throw Error(`Coverage for functions (${functions}%) does not meet global threshold (${threshold["functions"]}%)`);
		}

		const lines: number = parseInt(obj["total"]["lines"]["pct"]);
		if (lines < threshold["lines"]) {
			throw Error(`Coverage for lines (${lines}%) does not meet global threshold (${threshold["lines"]}%)`);
		}

		let filenames: string[] = [];
		Object.keys(obj).forEach(function(key) {
			if (key.endsWith(".ts")) {
				filenames.push(key.split("\\").slice(-1)[0]);
			}
		});

		const skipFiles = [
			'config.ts',
			'extension.ts'];
		filenames = filenames.concat(skipFiles);

		const gitDirectory = path.join(__dirname, '..', '..', '..', 'src');
		const sourceFiles = glob.sync('*.ts', { cwd: gitDirectory });
		const untestedFiles = sourceFiles.filter((file) => !filenames.includes(file));
		if (0 < untestedFiles.length) {
			throw Error(`Coverage does not exist for ${untestedFiles.join(', ')}`);
		}
	});
}
