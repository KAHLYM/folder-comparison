import * as assert from 'assert';
import * as git from '../../git/extract';
import { FileSystemTrie } from '../../trie';

suite('git', () => {

    suite('parse', () => {
        test("return empty trie if empty output", async () => {
            git._parse("", "", "");
            assert.equal(0, git.cache.get().getChildren(""));
        });

        [
            { output: "A C:/test/path.txt", status: 0 },
            { output: "D C:/test/path.txt", status: 1 },
            { output: "M C:/test/path.txt", status: 2 },
            { output: "R C:/test/path.txt", status: 3 },
        ].forEach(function (item) {
            test("add expected status '" + item.status + "'", () => {
                let fst: FileSystemTrie = git._parse(item.output, "", "");
                assert.equal(item.status, fst.getContent("C:/test/path.txt").status);
            });
        });

        [
            { output: "R0 C:/test/path.txt", score: 0 },
            { output: "R25 C:/test/path.txt", score: 25 },
            { output: "R100 C:/test/path.txt", score: 100 },
        ].forEach(function (item) {
            test("adds expected score '" + item.score + "'", () => {
                let fst: FileSystemTrie = git._parse(item.output, "", "");
                assert.equal(item.score, fst.getContent("C:/test/path.txt").score);
            });
        });

        test("adds left path and right path for rename", () => {
            let fst: FileSystemTrie = git._parse("R25 C:/test/left.txt C:/test/right.txt", "", "");
            assert.equal(true, fst.exists("C:/test/left.txt"));
            assert.equal(true, fst.exists("C:/test/right.txt"));
        });
    });
});
