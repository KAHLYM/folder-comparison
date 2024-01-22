import * as assert from 'assert';
import * as git from '../../git';
import { FileSystemTrie } from '../../trie';

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

    suite('parse', () => {
        test("return empty trie if empty output", async () => {
            git.parse("", "", "");
            assert.equal(0, git.cache.data.getChildren(""));
        });

        [
            { output: "A C:/test/path.txt", status: 0 },
            { output: "D C:/test/path.txt", status: 1 },
            { output: "M C:/test/path.txt", status: 2 },
            { output: "R C:/test/path.txt", status: 3 },
        ].forEach(function (item) {
            test("add expected status '" + item.status + "'", () => {
                let fst: FileSystemTrie = git.parse(item.output, "", "");
                assert.equal(item.status, fst.getContent("C:/test/path.txt").status);
            });
        });

        [
            { output: "R0 C:/test/path.txt", score: 0 },
            { output: "R25 C:/test/path.txt", score: 25 },
            { output: "R100 C:/test/path.txt", score: 100 },
        ].forEach(function (item) {
            test("adds expected score '" + item.score + "'", () => {
                let fst: FileSystemTrie = git.parse(item.output, "", "");
                assert.equal(item.score, fst.getContent("C:/test/path.txt").score);
            });
        });

        test("adds left path and right path for rename", () => {
            let fst: FileSystemTrie = git.parse("R25 C:/test/left.txt C:/test/right.txt", "", "");
            assert.equal(true, fst.exists("C:/test/left.txt"));
            assert.equal(true, fst.exists("C:/test/right.txt"));
        });
    });
});
