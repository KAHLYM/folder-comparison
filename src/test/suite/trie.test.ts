import * as assert from 'assert';
import { FileSystemTrie, FileSystemTrieNode } from '../../trie';

class MockFileSystemTrie extends FileSystemTrie {
    public getRoot(): FileSystemTrieNode {
        return super.root;
    }
}

suite('trie', () => {

    test('handles single directory', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo";
        const value: any = null;
        trie.add(key, value);

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.get(key));
    });

    test('handles single file', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo.txt";
        const value: any = null;
        trie.add(key, value);

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.get(key));
    });

    test('handles compound directory', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo/bar";
        const value: any = "oof";
        trie.add(key, value);

        assert.equal(true, trie.exists('foo'));
        assert.equal(null, trie.get('foo'));

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.get(key));
    });

    test('handles compound file', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const key: string = "foo/bar.txt";
        const value: any = "oof";
        trie.add(key, value);

        assert.equal(true, trie.exists('foo'));
        assert.equal(null, trie.get('foo'));

        assert.equal(true, trie.exists(key));
        assert.equal(value, trie.get(key));
    });

    test('handles mulitple filenames with different extensions', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const txtKey: string = "foo/bar.txt";
        const txtValue: any = "txtValue";
        trie.add(txtKey, txtValue);

        const mdKey: string = "foo/bar.md";
        const mdValue: any = "mdValue";
        trie.add(mdKey, mdValue);

        assert.equal(true, trie.exists(txtKey));
        assert.equal(txtValue, trie.get(txtKey));

        assert.equal(true, trie.exists(mdKey));
        assert.equal(mdValue, trie.get(mdKey));
    });

    test('handles mulitple filenames in different directories', () => {
        let trie: FileSystemTrie = new FileSystemTrie();

        const fooKey: string = "foo/baz.txt";
        const fooValue: any = "fooValue";
        trie.add(fooKey, fooValue);

        const barKey: string = "bar/baz.txt";
        const barValue: any = "barValue";
        trie.add(barKey, barValue);

        assert.equal(true, trie.exists(fooKey));
        assert.equal(fooValue, trie.get(fooKey));

        assert.equal(true, trie.exists(barKey));
        assert.equal(barValue, trie.get(barKey));
    });

    suite('constructor', () => {

        test('does not throw', () => {
            assert.doesNotThrow(() => new FileSystemTrie());
        });

        test.skip('creates root node', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            const root: FileSystemTrieNode = trie.getRoot();
            assert.equal("", root.key)
            assert.equal(null, context)
        });
    })

    suite('add function', () => {

    });

    suite('exists function', () => {

        let trie: MockFileSystemTrie = new MockFileSystemTrie();
        const path: string = "foo/bar/baz.txt";
        trie.add(path, null);
        [
            { exists: false, path: "" },
            { exists: true, path: "foo" },
            { exists: true, path: "foo/bar" },
            { exists: true, path: "foo/bar/baz.txt" },
            { exists: false, path: "baz.txt" }
        ].forEach(function (item) {
            test.skip("given '" + path + "' returns " + item.exists.toString() + " when passed '" + item.path + "'", function () {
                assert.equal(item.exists, trie.exists(item.path));
            });
        });
    });

    suite('get function', () => {

        test.skip('returns root node when passed empty path', () => {
            let trie: MockFileSystemTrie = new MockFileSystemTrie();

            assert.equal(trie.getRoot(), trie.get(""));
        });
    });
});
