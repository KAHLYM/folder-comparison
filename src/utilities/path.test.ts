import * as assert from 'assert';
import { toUnix, trimLeadingPathSeperators } from './path';

suite('path', () => {

    suite('toUnix', () => {
        [
            { filepath: "C:/test/path.txt", unixFilepath: "C:/test/path.txt" },
        ].forEach(function (item) {
            test("returns '" + item.unixFilepath + "' when passed '" + item.filepath + "'", () => {
                assert.equal(item.unixFilepath, toUnix(item.filepath));
            });
        });
    });

    suite('trimLeadingPathSeperators', () => {
        [
            { filepath: "/test/path.txt", trimmedFilepath: "test/path.txt" },
            { filepath: "//test/path.txt", trimmedFilepath: "test/path.txt" },
        ].forEach(function (item) {
            test("returns '" + item.trimmedFilepath + "' when passed '" + item.filepath + "'", () => {
                assert.equal(item.trimmedFilepath, trimLeadingPathSeperators(item.filepath));
            });
        });
    });
});
