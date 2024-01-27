import * as assert from 'assert';
import { toUnix } from './path';

suite('path', () => {

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
});
