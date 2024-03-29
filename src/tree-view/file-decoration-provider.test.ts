import * as assert from 'assert';
import { EntryStateDecorationProvider } from './file-decoration-provider';
import { FileDecoration, Uri } from 'vscode';

suite('file decoration provider', () => {

    test("returns null when passed invalid uri scheme", () => {
        let esdp = new EntryStateDecorationProvider();
        const fileDecoration: Promise<FileDecoration | null> = esdp.provideFileDecoration(Uri.parse("http://www.example.com/some/path?query#fragment"));
        fileDecoration.then(function (value) {
            assert.equal(null, value);
        });
    });

    [
        { uri: "file-comparison://www.example.com/some/path?addition#fragment", badge: "A", tooltip: "addition", color: "folderComparison.color.added" },
        { uri: "file-comparison://www.example.com/some/path?deletion#fragment", badge: "D", tooltip: "deletion", color: "folderComparison.color.deleted" },
        { uri: "file-comparison://www.example.com/some/path?modification#fragment", badge: "M", tooltip: "modification", color: "folderComparison.color.modified" },
        { uri: "file-comparison://www.example.com/some/path?rename#fragment", badge: "R", tooltip: "rename", color: "folderComparison.color.renamed" },
        { uri: "file-comparison://www.example.com/some/path?intermediate#fragment", badge: "", tooltip: "", color: "folderComparison.color.unchanged" },
        { uri: "file-comparison://www.example.com/some/path?null#fragment", badge: "", tooltip: "", color: "folderComparison.color.ignored" },
        { uri: "file-comparison://www.example.com/some/path?invalid#fragment", badge: "", tooltip: "", color: "folderComparison.color.ignored" },
    ].forEach(function (item) {
        test("returns expected file decoration when passed uri '" + item.uri + "'", async () => {
            let esdp = new EntryStateDecorationProvider();
            const fileDecoration: Promise<FileDecoration | null> = esdp.provideFileDecoration(Uri.parse(item.uri));
            fileDecoration.then(function (value) {
                assert.notEqual(null, value);

                assert.equal(item.badge, value?.badge);
                assert.equal(item.tooltip, value?.tooltip);
                assert.equal(item.color, value?.color);

                assert.equal(true, value?.propagate);
            });
        });
    });
});
