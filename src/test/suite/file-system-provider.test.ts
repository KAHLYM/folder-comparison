import * as vscode from 'vscode';
import * as assert from 'assert';
import * as tdp from '../../tree-view/tree-data-provider';
import * as ti from '../../tree-view/tree-item';
import { FileType } from 'vscode';
import { toUnix, makeUri } from '../../utilities';

suite('file system provider', () => {

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

    suite('FileTreeItem', () => {
        suite('subpath', () => {
            test("removes leading forwardslash", () => {
                const fti: ti.FileTreeItem = new ti.FileTreeItem(vscode.Uri.parse(""), vscode.Uri.parse(""), "C:/test/path.txt", FileType.File, 0);
                assert.equal("C:/test/path.txt", fti.subpath);
            });
        });
    });

    suite('FileSystemProvider', () => {
        suite('clear', () => {
            test("sets left and right to empty paths", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                tdp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                tdp_.clear();
                assert.equal(vscode.Uri.parse("").toString(), tdp_.left_.toString());
                assert.equal(vscode.Uri.parse("").toString(), tdp_.right_.toString());
            });
        });

        suite('update', () => {
            test("sets left and right", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                tdp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal("C:/test/left.txt", tdp_.left_);
                assert.equal("C:/test/right.txt", tdp_.right_);
            });
        });

        suite('isValid', () => {
            test("returns false when provided invalid left path", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "";
                const right: string = "C:/test/right.txt";
                tdp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal(false, tdp_.isValid());
            });

            test("returns false when provided invalid right path", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "";
                tdp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal(false, tdp_.isValid());
            });

            test("returns true when provided valid left and right path", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                tdp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
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
                    tdp_.update(vscode.Uri.parse(item.leftPath), vscode.Uri.parse(item.rightPath));
                    assert.equal(item.expected, tdp_.removePrefix(item.path, item.left, item.right));
                });
            });
        });

        suite('getLeftUri', () => {
            test("return expected uri", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: vscode.Uri = vscode.Uri.parse("C:/left");
                const right: vscode.Uri = vscode.Uri.parse("C:/right");
                tdp_.update(left, right);
                const fti: ti.FileTreeItem = new ti.FileTreeItem(left, right, "path.txt", FileType.File, 0);
                assert.equal("file:///left/path.txt", tdp_._getLeftUri(fti).toString());
            });
        });

        suite('getRightUri', () => {
            test("return expected uri", () => {
                const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                const left: vscode.Uri = vscode.Uri.parse("C:/left");
                const right: vscode.Uri = vscode.Uri.parse("C:/right");
                tdp_.update(left, right);
                const fti: ti.FileTreeItem = new ti.FileTreeItem(left, right, "path.txt", FileType.File, 0);
                assert.equal("file:///right/path.txt", tdp_._getRightUri(fti).toString());
            });
        });

        suite('getCommand', () => {
            [
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 0, command: "vscode.open" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 1, command: "vscode.open" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 2, command: "vscode.diff" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 3, command: "vscode.open" },
                { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 4, command: "vscode.open" },
            ].forEach(function (item) {
                test("returns command with expected constant attributes", () => {
                    const tdp_: tdp.FileSystemProvider = new tdp.FileSystemProvider();
                    const fti: ti.FileTreeItem = new ti.FileTreeItem(vscode.Uri.parse(item.left), vscode.Uri.parse(item.right), "path.txt", FileType.File, item.status);
                    
                    const command = tdp_._getCommand(fti);
                    assert.notEqual(null, command);
                    assert.equal(item.command, command?.command);
                    assert.equal("Open", command?.title);
                });
            });
        });
    });
});
