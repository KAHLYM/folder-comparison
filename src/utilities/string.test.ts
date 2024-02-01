import * as assert from 'assert';
import { removePrefixes } from './string';

suite('string', () => {

    // TODO Check that removePrefix behaves as expected
    suite('removePrefix', () => {
        [
            { path: "C:/test/path.txt", left: "", right: "", expected: "C:/test/path.txt" },
            { path: "C:/left/path.txt", left: "C:/left", right: "", expected: "/path.txt" },
            { path: "C:/right/path.txt", left: "", right: "C:/right", expected: "/path.txt" },
            { path: "C:/left/right/path.txt", left: "C:/left", right: "C:/left/right", expected: "/path.txt" },
        ].forEach(function (item) {
            test(`return expected path given ${item.left} and ${item.right}`, () => {
                assert.equal(item.expected, removePrefixes(item.path, [item.right, item.left]));
            });
        });
    });
});