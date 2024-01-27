import * as assert from 'assert';
import { FileTreeItem } from './tree-item';
import { FileType, Uri } from 'vscode';

suite('tree item', () => {

    suite('subpath', () => {
        test("removes leading forwardslash", () => {
            const fti: FileTreeItem = new FileTreeItem(Uri.parse(""), Uri.parse(""), "C:/test/path.txt", FileType.File, 0);
            assert.equal("C:/test/path.txt", fti.subpath);
        });
    });
});
