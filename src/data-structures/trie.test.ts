import * as assert from 'assert';
import { FileSystemTrie, FileSystemTrieNode } from './trie';

class MockFileSystemTrie extends FileSystemTrie {
      
    public root: FileSystemTrieNode = super.getRoot();

    public splitPath(path: string): string[] {
        return super.splitPath(path);
    }
}

function getMockFileSystemTrieExampleOne(): MockFileSystemTrie {
    let trie: MockFileSystemTrie = new MockFileSystemTrie();
    trie.add("foo/bar.txt", "a", { });
    trie.add("foo/bar.md", "b", { });
    trie.add("baz.txt", "c", { });
    return trie;
}

suite('trie', () => {

    test('handles single directory', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo";
        const value: any = null;
        trie.add(key, value, { });

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.getContent(key));
    });

    test('handles single file', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo.txt";
        const value: any = null;
        trie.add(key, value, { });

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.getContent(key));
    });

    test('handles compound directory', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo/bar";
        const value: any = "oof";
        trie.add(key, value, { });

        assert.equal(true, trie.exists('foo'));
        assert.deepEqual({ }, trie.getContent('foo'));

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.getContent(key));
    });

    test('handles compound file', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo/bar.txt";
        const value: any = "oof";
        trie.add(key, value, { });

        assert.equal(true, trie.exists('foo'));
        assert.deepEqual({ }, trie.getContent('foo'));

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.getContent(key));
    });

    test('handles mulitple filenames with different extensions', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const txtKey: string = "foo/bar.txt";
        const txtValue: any = "txtValue";
        trie.add(txtKey, txtValue, { });

        const mdKey: string = "foo/bar.md";
        const mdValue: any = "mdValue";
        trie.add(mdKey, mdValue, { });

        assert.equal(true, trie.exists(txtKey));
        assert.equal(txtValue, trie.getContent(txtKey));

        assert.equal(true, trie.exists(mdKey));
        assert.equal(mdValue, trie.getContent(mdKey));
    });

    test('handles mulitple filenames in different directories', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const fooKey: string = "foo/baz.txt";
        const fooValue: any = "fooValue";
        trie.add(fooKey, fooValue, { });

        const barKey: string = "bar/baz.txt";
        const barValue: any = "barValue";
        trie.add(barKey, barValue, { });

        assert.equal(true, trie.exists(fooKey));
        assert.equal(fooValue, trie.getContent(fooKey));

        assert.equal(true, trie.exists(barKey));
        assert.equal(barValue, trie.getContent(barKey));
    });

    suite('constructor', () => {

        test('does not throw', () => {
            assert.doesNotThrow(() => new FileSystemTrie());
        });

        test.skip('creates root node', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            const root: FileSystemTrieNode = trie.getRoot();
            assert.equal("", root.key);
            assert.equal(null, context);
        });
    });

    suite('splitPath function', () => {

        test('returns empty array when passed empty string', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.deepEqual([], trie.splitPath(""));
        });

        test('handles compound directory', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.deepEqual(["foo", "bar", "baz"], trie.splitPath("foo/bar/baz"));
        });
    });

    suite('add function', () => {

    });

    suite('exists function', () => {

        let trie: MockFileSystemTrie = new MockFileSystemTrie();
        const path: string = "foo/bar/baz.txt";
        trie.add(path, null, { });
        [
            { exists: true, path: "" },
            { exists: true, path: "foo" },
            { exists: true, path: "foo/bar" },
            { exists: true, path: "foo/bar/baz.txt" },
            { exists: false, path: "foo/baz/bar.txt" },
            { exists: false, path: "baz.txt" }
        ].forEach(function (item) {
            test("given '" + path + "' returns " + item.exists.toString() + " when passed '" + item.path + "'", function () {
                assert.equal(item.exists, trie.exists(item.path));
            });
        });
    });

    suite('getContent function', () => {

        test('does not throw when passed empty path', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.doesNotThrow(() => {
                trie.getContent("");
            });
        });

        test('throws when passed invalid path', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.throws(() => {
                trie.getContent("foo");
            });
        });
    });

    suite('getChildren function', () => {

        test('does not throw when passed empty path', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.doesNotThrow(() => {
                trie.getChildren("");
            });
        });

        test('throws when passed invalid path', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.throws(() => {
                trie.getChildren("foo");
            });
        });

        test('handles MockFileSystemTrieExampleOne', () => {
            let trie: MockFileSystemTrie = getMockFileSystemTrieExampleOne();

            assert.equal(2, trie.getChildren("").length);
            assert.equal(2, trie.getChildren("foo").length);
        });
    });
});
