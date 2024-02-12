import * as assert from 'assert';
import { _isDirectory } from './unzip';

suite('unzip', () => {

    class MockEntry {
        constructor(filename: string) {
            this.fileName = filename;
        }

        public fileName: string;
    }

    suite('_isDirectory', () => {
        [
            { path: "C:/test/path.txt", isDirectory: false },
            { path: "C:/test.txt/path", isDirectory: false },
            { path: "C:/test/path/", isDirectory: true },
        ].forEach(function (item) {
            test(`return expected given ${item.path}`, () => {
                const entry = new MockEntry(item.path);
                assert.equal(item.isDirectory, _isDirectory(entry));
            });
        });
    });
});
