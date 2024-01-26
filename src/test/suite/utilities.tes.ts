import * as assert from 'assert';
import { toUnix, makeUri } from '../../utilities';

suite('utilities', () => {

    suite('toUnix', () => {
        [
            { filepath: "C:/test/path.txt", unixFilepath: "C:/test/path.txt" },
            // { filepath: "C:\\test\\path.txt", unixFilepath: "C:/test/path.txt" },
        ].forEach(function (item) {
            test("returns '" + item.unixFilepath + "' when passed '" + item.filepath + "'", () => {
                assert.equal(item.unixFilepath, toUnix(item.filepath));
            });
        });
    });

    suite('makeUri', () => {
        [
            { filepath: "C:/test/path.txt", status: 0, uri: "file-comparison:/c%3A/test/path.txt?addition" },
            { filepath: "C:/test/path.txt", status: 1, uri: "file-comparison:/c%3A/test/path.txt?deletion" },
            // { filepath: "C:/test/path.txt", status: 9, uri: "file-comparison:/c%3A/test/path.txt?null" },
            // { filepath: "C:\\test\\path.txt", status: 0, uri: "file-comparison:/c%3A/test/path.txt?addition" },
        ].forEach(function (item) {
            test("returns '" + item.uri + "' when passed '" + item.filepath + "' with status '" + item.status + "'", () => {
                assert.equal(item.uri, makeUri(item.filepath, item.status).toString());
            });
        });
    });
});
