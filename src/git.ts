import { execSync } from 'child_process';
import { FileSystemTrie } from './trie';
import { workspace } from 'vscode';
import { createHash } from 'crypto';

export enum Status {
    addition,
    deletion,
    modification,
    rename,
    null,
}

export function statusToString(status: Status) {
    switch (status) {
        case Status.addition: {
            return "addition";
        }
        case Status.deletion: {
            return "deletion";
        }
        case Status.modification: {
            return "modification";
        }
        case Status.rename: {
            return "rename";
        }
        default: {
            return "null";
        }
    }
}

export function stringToStatus(status: string) {
    switch (status) {
        case "addition": {
            return Status.addition;
        }
        case "deletion": {
            return Status.deletion;
        }
        case "modification": {
            return Status.modification;
        }
        case "rename": {
            return Status.rename;
        }
        default: {
            return Status.Null
        }
    }
}

export interface NameStatus {
    status: Status;
    score: number,
    left: string;
    right: string;
}

let cache = { 
    hash: createHash("md5").update("").digest("hex"),
    data: new FileSystemTrie(),
}

export function diff(left: string, right: string): FileSystemTrie {
    let stdout: Buffer;
    try {
        const args = workspace.getConfiguration('folderComparison').get<string[]>('commandArguments');
        stdout = execSync(`git diff ${args ? args.join(" ") : ""} ${left.replaceAll("\\", "/")} ${right.replaceAll("\\", "/")}`, { timeout: 1000 });
    } catch (err: any) {
        stdout = err.stdout;
    }
    
    let newHash: string = createHash("md5").update(stdout).digest("hex");
    if (newHash == cache.hash) {
        return cache.data;
    }

    const parsed = parse(stdout.toString(), left.replaceAll('\\', '/') + '/', right.replaceAll('\\', '/') + '/');

    cache.hash = newHash;
    cache.data = parsed;

    return parsed;
}

const name_status_regex: RegExp = /(?<status>[A-Z])(?<score>[0-9]*)\s+(?<left>[^\s]+)\s*(?<right>[^\s]*)/;
function parse(output: string, leftHi: string, rightHi: string): FileSystemTrie {
    let trie: FileSystemTrie = new FileSystemTrie();

    for (const line of output.split("\n")) {
        const [_group, status, score, left, right] = name_status_regex.exec(line) || ["", "", "", "", ""];

        const leftSubpath: string = left.replace(rightHi, "").replace(leftHi, "");
        const rightSubpath: string = right.replace(rightHi, "");

        const intermediate: NameStatus = { status: Status.Null, score: 0, left: "", right: "" };
        switch (status) {
            case 'A':
                trie.add(leftSubpath, { status: Status.addition, score: 0, left: "", right: left }, intermediate);
                break;
            case 'D':
                trie.add(leftSubpath, { status: Status.deletion, score: 0, left: left, right: right }, intermediate);
                break;
            case 'M':
                trie.add(leftSubpath, { status: Status.modification, score: 0, left: left, right: right }, intermediate);
                break;
            case 'R':
                const nameStatus: NameStatus = { status: Status.rename, score: parseInt(score), left: left, right: right };
                trie.add(leftSubpath, nameStatus, intermediate);
                trie.add(rightSubpath, nameStatus, intermediate);
                break;
            default:
                continue;
        }
    }

    return trie;
}
