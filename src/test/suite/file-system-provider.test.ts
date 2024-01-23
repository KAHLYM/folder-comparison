import * as vscode from 'vscode';
import * as assert from 'assert';
import * as fsp from '../../file-system-provider';
import { FileType } from 'vscode';

suite('file system provider', () => {

    suite('toUnix', () => {
        [
            { filepath: "C:/test/path.txt", unixFilepath: "C:/test/path.txt" },
            { filepath: "C:\\test\\path.txt", unixFilepath: "C:/test/path.txt" },
        ].forEach(function (item) {
            test("returns '" + item.unixFilepath + "' when passed '" + item.filepath + "'", () => {
                assert.equal(item.unixFilepath, fsp.toUnix(item.filepath));
            });
        });
    });

    suite('makeUri', () => {
        [
            { filepath: "C:/test/path.txt", status: 0, uri: "file-comparison:/c%3A/test/path.txt?addition" },
            { filepath: "C:/test/path.txt", status: 1, uri: "file-comparison:/c%3A/test/path.txt?deletion" },
            { filepath: "C:/test/path.txt", status: 9, uri: "file-comparison:/c%3A/test/path.txt?null" },
            { filepath: "C:\\test\\path.txt", status: 0, uri: "file-comparison:/c%3A/test/path.txt?addition" },
        ].forEach(function (item) {
            test("returns '" + item.uri + "' when passed '" + item.filepath + "' with status '" + item.status + "'", () => {
                assert.equal(item.uri, fsp.makeUri(item.filepath, item.status).toString());
            });
        });
    });

    suite('FileTreeItem', () => {
        suite('subpath', () => {
            test("removes leading forwardslash", () => {
                const fti: fsp.FileTreeItem = new fsp.FileTreeItem(vscode.Uri.parse(""), vscode.Uri.parse(""), "C:/test/path.txt", FileType.File, 0);
                assert.equal("C:/test/path.txt", fti.subpath);
            });
        });
    });

    suite('FileSystemProvider', () => {
        suite('clear', () => {
            test("sets left and right to empty paths", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                fsp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                fsp_.clear();
                assert.equal(vscode.Uri.parse("").toString(), fsp_.left_.toString());
                assert.equal(vscode.Uri.parse("").toString(), fsp_.right_.toString());
            });
        });

        suite('update', () => {
            test("sets left and right", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                fsp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal("C:/test/left.txt", fsp_.left_);
                assert.equal("C:/test/right.txt", fsp_.right_);
            });
        });

        suite('isValid', () => {
            test("returns false when provided invalid left path", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: string = "";
                const right: string = "C:/test/right.txt";
                fsp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal(false, fsp_.isValid());
            });

            test("returns false when provided invalid right path", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "";
                fsp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal(false, fsp_.isValid());
            });

            test("returns true when provided valid left and right path", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: string = "C:/test/left.txt";
                const right: string = "C:/test/right.txt";
                fsp_.update(vscode.Uri.parse(left), vscode.Uri.parse(right));
                assert.equal(true, fsp_.isValid());
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
                    const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                    fsp_.update(vscode.Uri.parse(item.leftPath), vscode.Uri.parse(item.rightPath));
                    assert.equal(item.expected, fsp_.removePrefix(item.path, item.left, item.right));
                });
            });
        });

        suite('getLeftUri', () => {
            test("return expected uri", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: vscode.Uri = vscode.Uri.parse("C:/left");
                const right: vscode.Uri = vscode.Uri.parse("C:/right");
                fsp_.update(left, right);
                const fti: fsp.FileTreeItem = new fsp.FileTreeItem(left, right, "path.txt", FileType.File, 0);
                assert.equal("file:///left/path.txt", fsp_._getLeftUri(fti).toString());
            });
        });

        suite('getRightUri', () => {
            test("return expected uri", () => {
                const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                const left: vscode.Uri = vscode.Uri.parse("C:/left");
                const right: vscode.Uri = vscode.Uri.parse("C:/right");
                fsp_.update(left, right);
                const fti: fsp.FileTreeItem = new fsp.FileTreeItem(left, right, "path.txt", FileType.File, 0);
                assert.equal("file:///right/path.txt", fsp_._getRightUri(fti).toString());
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
                    const fsp_: fsp.FileSystemProvider = new fsp.FileSystemProvider();
                    const fti: fsp.FileTreeItem = new fsp.FileTreeItem(vscode.Uri.parse(item.left), vscode.Uri.parse(item.right), "path.txt", FileType.File, item.status);
                    
                    const command = fsp_._getCommand(fti);
                    assert.notEqual(null, command);
                    assert.equal(item.command, command?.command);
                    assert.equal("Open", command?.title);
                });
            });
        });
    });
});
