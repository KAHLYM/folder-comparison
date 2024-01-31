import * as fs from 'fs';
import * as path from 'path';
import { FileStat, FileType, FileSystemError  } from 'vscode';

/* istanbul ignore next: difficult to unit test */
function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
    if (error) {
        reject(massageError(error));
    } else {
        resolve(result);
    }
}

export function massageError(error: Error & { code?: string }): Error {
    if (error.code === 'ENOENT') {
        return FileSystemError.FileNotFound();
    }

    if (error.code === 'EISDIR') {
        return FileSystemError.FileIsADirectory();
    }

    if (error.code === 'EEXIST') {
        return FileSystemError.FileExists();
    }

    if (error.code === 'EPERM' || error.code === 'EACCES') {
        return FileSystemError.NoPermissions();
    }

    return error;
}

export function readDirectory(directory: string): [string, FileType][] | Thenable<[string, FileType][]> {
    return _readDirectory(directory);
}

/* istanbul ignore next: not designed for unit test */
async function _readDirectory(directory: string): Promise<[string, FileType][]> {
    const children = await _readdir(directory);

    const result: [string, FileType][] = [];
    for (const child of children) {
        const _stat = await stat(path.join(directory, child));
        result.push([child, _stat.type]);
    }

    return Promise.resolve(result);
}

/* istanbul ignore next: difficult to unit test */
function _readdir(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (error, children) => handleResult(resolve, reject, error, children));
    });
}

/* istanbul ignore next: difficult to unit test */
export async function stat(path: string): Promise<FileStat> {
    return new FileStatEx(await _stat(path));
}

/* istanbul ignore next: difficult to unit test */
async function _stat(path: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
        fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
    });
}

/* istanbul ignore next: difficult to unit test */
export function exists(path: string): boolean | Thenable<boolean> {
    return _exists(path);
}

/* istanbul ignore next: difficult to unit test */
async function _exists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.exists(path, exists => handleResult(resolve, reject, null, exists));
    });
}

/* istanbul ignore next: difficult to unit test */
export class FileStatEx implements FileStat {

	constructor(private fsStat: fs.Stats) { }

	get type(): FileType {
		return this.fsStat.isFile() ? FileType.File : this.fsStat.isDirectory() ? FileType.Directory : this.fsStat.isSymbolicLink() ? FileType.SymbolicLink : FileType.Unknown;
	}

	get isFile(): boolean | undefined {
		return this.fsStat.isFile();
	}

	get isDirectory(): boolean | undefined {
		return this.fsStat.isDirectory();
	}

	get isSymbolicLink(): boolean | undefined {
		return this.fsStat.isSymbolicLink();
	}

	get size(): number {
		return this.fsStat.size;
	}

	get ctime(): number {
		return this.fsStat.ctime.getTime();
	}

	get mtime(): number {
		return this.fsStat.mtime.getTime();
	}
}
