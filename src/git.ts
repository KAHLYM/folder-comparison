import { execSync } from 'child_process';
import { FileSystemTrie } from './trie';
import { workspace } from 'vscode';

export enum Status {
    Addition,
    Deletion,
    Modification,
    Rename,
    Null,
}

export function statusToString(status: Status) {
    switch (status) {
        case Status.Addition: {
            return "addition";
        }
        case Status.Deletion: {
            return "deletion";
        }
        case Status.Modification: {
            return "modification";
        }
        case Status.Rename: {
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
            return Status.Addition;
        }
        case "deletion": {
            return Status.Deletion;
        }
        case "modification": {
            return Status.Modification;
        }
        case "rename": {
            return Status.Rename;
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

export function diff(left: string, right: string): FileSystemTrie {
    let stdout: Buffer;
    try {
        const args = workspace.getConfiguration('folderComparison').get<string[]>('commandArguments');
        stdout = execSync(`git diff ${args ? args.join(" ") : ""} ${left.replaceAll("\\", "/")} ${right.replaceAll("\\", "/")}`, { timeout: 1000 });
    } catch (err: any) {
        stdout = err.stdout;
    }
    return parse(stdout.toString(), left.replaceAll('\\', '/') + '/', right.replaceAll('\\', '/') + '/');
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
                trie.add(leftSubpath, { status: Status.Addition, score: 0, left: "", right: left }, intermediate);
                break;
            case 'D':
                trie.add(leftSubpath, { status: Status.Deletion, score: 0, left: left, right: right }, intermediate);
                break;
            case 'M':
                trie.add(leftSubpath, { status: Status.Modification, score: 0, left: left, right: right }, intermediate);
                break;
            case 'R':
                const nameStatus: NameStatus = { status: Status.Rename, score: parseInt(score), left: left, right: right };
                trie.add(leftSubpath, nameStatus, intermediate);
                trie.add(rightSubpath, nameStatus, intermediate);
                break;
            default:
                continue;
        }
    }

    return trie;
}
