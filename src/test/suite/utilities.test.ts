import * as vscode from 'vscode';
import * as assert from 'assert';
import * as utilities from '../../utilities';

suite('utilities', () => {

    suite('massageError', () => {
        [
            { errorCode: "ENOENT", error: vscode.FileSystemError.FileNotFound() },
            { errorCode: "EISDIR", error: vscode.FileSystemError.FileIsADirectory() },
            { errorCode: "EEXIST", error: vscode.FileSystemError.FileExists() },
            { errorCode: "EPERM", error: vscode.FileSystemError.NoPermissions() },
            { errorCode: "EACCES", error: vscode.FileSystemError.NoPermissions() },
        ].forEach(function (item) {
            test("returns '" + item.error + "' when passed '" + item.error + "'", () => {
                assert.deepEqual(item.error, utilities.massageError({ name: "Error", code: item.errorCode, message: "Message" } as Error));
            });
        });

        test("returns error when passed unknown", () => {
            const error: Error = { name: "Error", code: "Unknown", message: "Message" } as Error;
            assert.equal(error.name, utilities.massageError(error).name);
            assert.equal(error.message, utilities.massageError(error).message);
        });
    });
});
