import * as assert from 'assert';
import * as tdp from './tree-data-provider';
import * as ti from './tree-item';
import { FileType, Uri } from 'vscode';

suite('file system provider', () => {

    suite('FileSystemProvider', () => {
        suite('clear', () => {
            test("sets left and right to empty paths", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                tdp_.update(Uri.parse(left), Uri.parse(right));
                tdp_.clear();
                assert.equal(Uri.parse("").toString(), tdp_.left_.toString());
                assert.equal(Uri.parse("").toString(), tdp_.right_.toString());
            });
        });

        suite('update', () => {
            test("sets left and right", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                tdp_.update(Uri.parse(left), Uri.parse(right));
                assert.equal("C:/test/left.txt", tdp_.left_);
                assert.equal("C:/test/right.txt", tdp_.right_);
            });
        });

        suite('isValid', () => {
            test("returns false when provided invalid left path", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "";
                const right: string = "C:/test/right.txt";
                tdp_.update(Uri.parse(left), Uri.parse(right));
                assert.equal(false, tdp_.isValid());
            });

            test("returns false when provided invalid right path", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "";
                tdp_.update(Uri.parse(left), Uri.parse(right));
                assert.equal(false, tdp_.isValid());
            });

            test("returns true when provided valid left and right path", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                tdp_.update(Uri.parse(left), Uri.parse(right));
                assert.equal(true, tdp_.isValid());
            });
        });

        // TODO Check that removePrefix behaves as expected
        suite('removePrefix', () => {
            [
                { path: "C:/test/path.txt", leftPath: "C:/test", left: false, rightPath: "C:/test", right: false, expected: ":/test/path.txt" },
                { path: "C:/left/path.txt", leftPath: "C:/left", left: true, rightPath: "C:/test", right: false, expected: ":/path.txt" },
                { path: "C:/right/path.txt", leftPath: "C:/test", left: false, rightPath: "C:/right", right: true, expected: ":/path.txt" },
                { path: "C:/left/right/path.txt", leftPath: "C:/left", left: true, rightPath: "C:/left/right", right: true, expected: ":/path.txt" },
            ].forEach(function (item) {
                test("return expected path given left and right", () => {
                    const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                    tdp_.update(Uri.parse(item.leftPath), Uri.parse(item.rightPath));
                    assert.equal(item.expected, tdp_.removePrefix(item.path, item.left, item.right));
                });
            });
        });

        suite('getLeftUri', () => {
            test("return expected uri", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: Uri = Uri.parse("C:/left");
                const right: Uri = Uri.parse("C:/right");
                tdp_.update(left, right);
                const fti: ti.FileTreeItem = new ti.FileTreeItem(left, right, "path.txt", FileType.File, 0);
                assert.equal("file:///left/path.txt", tdp_._getLeftUri(fti).toString());
            });
        });

        suite('getRightUri', () => {
            test("return expected uri", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: Uri = Uri.parse("C:/left");
                const right: Uri = Uri.parse("C:/right");
                tdp_.update(left, right);
                const fti: ti.FileTreeItem = new ti.FileTreeItem(left, right, "path.txt", FileType.File, 0);
                assert.equal("file:///right/path.txt", tdp_._getRightUri(fti).toString());
            });
        });

        suite('getCommand', () => {
            [
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 0, command: "open" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 1, command: "open" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 2, command: "diff" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 3, command: "open" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 4, command: "open" },
            ].forEach(function (item) {
                test("returns command with expected constant attributes", () => {
                    const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                    const fti: ti.FileTreeItem = new ti.FileTreeItem(Uri.parse(item.left), Uri.parse(item.right), "path.txt", FileType.File, item.status);
                    
                    const command = tdp_._getCommand(fti);
                    assert.notEqual(null, command);
                    assert.equal(item.command, command?.command);
                    assert.equal("Open", command?.title);
                });
            });
        });
    });
});
