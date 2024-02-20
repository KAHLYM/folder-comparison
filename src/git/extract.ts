import { execSync } from 'child_process';
import { FileSystemTrie } from '../data-structures/trie';
import { workspace } from 'vscode';
import { getTranslationByAbbreviation } from './translation';
import { Cache } from '../data-structures/cache';
import { toUnix } from '../utilities/path';

export enum Status {
    addition,
    deletion,
    modification,
    rename,
    intermediate,
    null,
}

export interface NameStatus {
    status: Status;
    score: number,
    left: string;
    right: string;
    hasNoPreRename: boolean;
}

export let cache: Cache = new Cache("", new FileSystemTrie());

/* istanbul ignore next: difficult to unit test */
export function diff(left: string, right: string): FileSystemTrie {
    let stdout: Buffer;
    try {
        const args = workspace.getConfiguration('folderComparison').get<string[]>('commandArguments');
        stdout = execSync(`git diff ${args ? args.join(" ") : ""} "${toUnix(left)}" "${toUnix(right)}"`, { timeout: 1000 });
    } catch (err: any) {
        stdout = err.stdout;
    }

    if (cache.test(stdout.toString())) {
        return cache.get();
    }

    const parsed = _parse(stdout.toString(), left.replaceAll('\\', '/') + '/', right.replaceAll('\\', '/') + '/');

    cache.update(stdout.toString(), parsed);

    return parsed;
}

const nameStatusRegex: RegExp = /(?<status>[A-Z])(?<score>[0-9]*)\s+(?<left>[^\s]+)\s*(?<right>[^\s]*)/;
/* istanbul ignore next: TODO */
export function _extractNameStatus(line: string): NameStatus {
    const [_group, status, score, left, right] = nameStatusRegex.exec(line) || ["", "", "", "", ""];
    return { status: getTranslationByAbbreviation(status).status, score: Number(score), left: left, right: right, hasNoPreRename: true };
}

export function _updatehasNoPreRename(before: any, after: any): any {
    let intermediate = before;
    intermediate.hasNoPreRename = after.hasNoPreRename ? true : before.hasNoPreRename;
    return intermediate;
}

export function _parse(output: string, leftFolder: string, rightFolder: string): FileSystemTrie {
    let trie: FileSystemTrie = new FileSystemTrie();

    for (const line of output.split("\n")) {
        const nameStatus = _extractNameStatus(line);

        const intermediate: NameStatus = { status: Status.intermediate, score: 0, left: "", right: "",  hasNoPreRename: true};
        switch (nameStatus.status) {
            case Status.addition:
                trie.add(nameStatus.left.replace(rightFolder, ""), { status: Status.addition, score: nameStatus.score, left: "", right: nameStatus.left }, intermediate, _updatehasNoPreRename);
                break;
            case Status.deletion:
                trie.add(nameStatus.left.replace(leftFolder, ""), { status: Status.deletion, score: nameStatus.score, left: nameStatus.left, right: "" }, intermediate, _updatehasNoPreRename);
                break;
            case Status.modification:
                trie.add(nameStatus.left.replace(leftFolder, ""), { status: Status.modification, score: nameStatus.score, left: nameStatus.left, right: nameStatus.right }, intermediate, _updatehasNoPreRename);
                break;
            case Status.rename:
                const _nameStatus: NameStatus = { status: Status.rename, score: nameStatus.score, left: nameStatus.left, right: nameStatus.right, hasNoPreRename: true };
                const nonPreRenameIntermediate = intermediate;
                nonPreRenameIntermediate.hasNoPreRename = false;
                trie.add(nameStatus.left.replace(leftFolder, ""), _nameStatus, nonPreRenameIntermediate, _updatehasNoPreRename);
                trie.add(nameStatus.right.replace(rightFolder, ""), _nameStatus, intermediate, _updatehasNoPreRename);
                break;
        }
    }

    return trie;
}
