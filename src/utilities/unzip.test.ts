import * as assert from 'assert';
import { _isDirectory } from './unzip';

suite('unzip', () => {

    suite('_isDirectory', () => {
        [
            { path: "C:/test/path.txt", isDirectory: false },
            { path: "C:/test.txt/path", isDirectory: true },
            { path: "C:/test/path/", isDirectory: true },
        ].forEach(function (item) {
            test(`return expected given ${item.path}`, () => {
                assert.equal(item.isDirectory, _isDirectory(item.path));
            });
        });
    });
});
