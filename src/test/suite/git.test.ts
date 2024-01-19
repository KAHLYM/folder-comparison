import * as assert from 'assert';
import * as git from '../../git';

suite('git', () => {

    suite('statusToString', () => {
        [
            { string: "addition", status: git.Status.addition },
            { string: "deletion", status: git.Status.deletion },
            { string: "modification", status: git.Status.modification },
            { string: "rename", status: git.Status.rename },
            { string: "null", status: git.Status.null },
        ].forEach(function (item) {
            test("returns '" + item.string + "' when passed '" + item.status + "'", () => {
                assert.equal(item.string, git.statusToString(item.status));
            });
        });
    });

    suite('stringToStatus', () => {
        [
            { string: "addition", status: git.Status.addition },
            { string: "deletion", status: git.Status.deletion },
            { string: "modification", status: git.Status.modification },
            { string: "rename", status: git.Status.rename },
            { string: "invalid", status: git.Status.null },
        ].forEach(function (item) {
            test("returns '" + item.status + "' when passed '" + item.string + "'", () => {
                assert.equal(item.status, git.stringToStatus(item.string));
            });
        });
    });
});
