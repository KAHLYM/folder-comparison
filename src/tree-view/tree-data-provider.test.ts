import * as assert from 'assert';
import { FileSystemProvider } from './tree-data-provider';
import { FileTreeItem } from './tree-item';
import { FileType, Uri } from 'vscode';

suite('tree data provider', () => {

    suite('clear', () => {
        test("sets left and right to empty paths", () => {
            const tdp_: FileSystemProvider = new FileSystemProvider();
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
            const tdp_: FileSystemProvider = new FileSystemProvider();
            const left: string = "C:/test/left.txt";
            const right: string = "C:/test/right.txt";
            tdp_.update(Uri.parse(left), Uri.parse(right));
            assert.equal("C:/test/left.txt", tdp_.left_);
            assert.equal("C:/test/right.txt", tdp_.right_);
        });
    });

    suite('isValid', () => {
        test("returns false when provided invalid left path", () => {
            const tdp_: FileSystemProvider = new FileSystemProvider();
            const left: string = "";
            const right: string = "C:/test/right.txt";
            tdp_.update(Uri.parse(left), Uri.parse(right));
            assert.equal(false, tdp_._isValid());
        });

        test("returns false when provided invalid right path", () => {
            const tdp_: FileSystemProvider = new FileSystemProvider();
            const left: string = "C:/test/left.txt";
            const right: string = "";
            tdp_.update(Uri.parse(left), Uri.parse(right));
            assert.equal(false, tdp_._isValid());
        });

        test("returns true when provided valid left and right path", () => {
            const tdp_: FileSystemProvider = new FileSystemProvider();
            const left: string = "C:/test/left.txt";
            const right: string = "C:/test/right.txt";
            tdp_.update(Uri.parse(left), Uri.parse(right));
            assert.equal(true, tdp_._isValid());
        });
    });

    suite('_getLeftUri', () => {
        test("return expected uri", () => {
            const tdp_: FileSystemProvider = new FileSystemProvider();
            const left: Uri = Uri.parse("C:/left");
            const right: Uri = Uri.parse("C:/right");
            tdp_.update(left, right);
            const fti: FileTreeItem = new FileTreeItem(left, right, "path.txt", FileType.File, 0);
            assert.equal("file:///left/path.txt", tdp_._getLeftUri(fti).toString());
        });
    });

    suite('_getRightUri', () => {
        test("return expected uri", () => {
            const tdp_: FileSystemProvider = new FileSystemProvider();
            const left: Uri = Uri.parse("C:/left");
            const right: Uri = Uri.parse("C:/right");
            tdp_.update(left, right);
            const fti: FileTreeItem = new FileTreeItem(left, right, "path.txt", FileType.File, 0);
            assert.equal("file:///right/path.txt", tdp_._getRightUri(fti).toString());
        });
    });

    suite('_getCommand', () => {
        [
            { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 0, command: "vscode.open" },
            { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 1, command: "vscode.open" },
            { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 2, command: "vscode.diff" },
            { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 3, command: "vscode.open" },
            { left: "C:/left/path.txt", right: "C:/right/path.txt", status: 4, command: "vscode.open" },
        ].forEach(function (item) {
            test("returns command with expected constant attributes", () => {
                const tdp_: FileSystemProvider = new FileSystemProvider();
                const fti: FileTreeItem = new FileTreeItem(Uri.parse(item.left), Uri.parse(item.right), "path.txt", FileType.File, item.status);

                const command = tdp_._getCommand(fti);
                assert.notEqual(null, command);
                assert.equal(item.command, command?.command);
                assert.equal("Open", command?.title);
            });
        });
    });
});
