import * as assert from 'assert';
import { Status } from "../git/extract";
import { FCUri } from "./uri";


suite('uri', () => {

    suite('constructor', () => {
        [
            { filepath: "C:/test/path.txt", status: 0, uri: "file-comparison:/c%3A/test/path.txt?addition" },
            { filepath: "C:/test/path.txt", status: 1, uri: "file-comparison:/c%3A/test/path.txt?deletion" },
            // { filepath: "C:/test/path.txt", status: 9, uri: "file-comparison:/c%3A/test/path.txt?null" },
            // { filepath: "C:\\test\\path.txt", status: 0, uri: "file-comparison:/c%3A/test/path.txt?addition" },
        ].forEach(function (item) {
            test("returns '" + item.uri + "' when passed '" + item.filepath + "' with status '" + item.status + "'", () => {
                const uri: FCUri = new FCUri(item.filepath, item.status);
                assert.equal(item.uri, uri.getUri().toString());
            });
        });
    });

    suite('getPath', () => {
        test.skip("remove leading forwardslash", () => {
            const uri: FCUri = new FCUri("C:/test/filename.txt", Status.addition);
            assert.equal("C:/test/filename.txt", uri.getPath());
        });
    });

    suite('getStatus', () => {
        test("translated status from query", () => {
            const uri: FCUri = new FCUri("C:/test/filename.txt", Status.addition);
            assert.equal(Status.addition, uri.getStatus());
        });
    });

    suite('getUri', () => {
        test("does not return null string", () => {
            const uri: FCUri = new FCUri("C:/test/filename.txt", Status.addition);
            assert.notEqual(null, uri.getUri());
        });
    });
});
