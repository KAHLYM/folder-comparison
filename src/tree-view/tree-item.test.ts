import * as assert from 'assert';
import * as ti from './tree-item';
import { FileType, Uri } from 'vscode';

suite('FileTreeItem', () => {

    suite('subpath', () => {
        test("removes leading forwardslash", () => {
            const fti: ti.FileTreeItem = new ti.FileTreeItem(Uri.parse(""), Uri.parse(""), "C:/test/path.txt", FileType.File, 0);
            assert.equal("C:/test/path.txt", fti.subpath);
        });
    });
});