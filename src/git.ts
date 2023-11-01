import { execSync } from 'child_process';

export enum Status {
    Addition,
    Deletion,
    Modification,
    Rename,
    Null,
}

export function statusToString(status: Status) {
    switch(status) {
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
    switch(status) {
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

export function diff(left: string, right: string): NameStatus[] {
    let stdout: Buffer;
    try {
        stdout = execSync(`git diff ${left.replaceAll("\\", "/")} ${right.replaceAll("\\", "/")} --name-status`, { timeout: 1000 });
    } catch (err: any){
        stdout = err.stdout;
    }
    return parse(stdout.toString());
}

const name_status_regex: RegExp = /(?<status>[A-Z])(?<score>[0-9]*)\s+(?<left>[^\s]+)\s*(?<right>[^\s]*)/;
function parse(output: string): NameStatus[] {
    let name_statuses: NameStatus[] = [];

    for (const line of output.split("\n")) {
        const [_group, status, score, left, right] = name_status_regex.exec(line) || ["", "", "", "", ""];

        switch (status) {
            case 'A':
                name_statuses.push({ status: Status.Addition, score: 0, left: "", right: left });
                break;
            case 'D':
                name_statuses.push({ status: Status.Deletion, score: 0, left: left, right: right });
                break;
            case 'M':
                name_statuses.push({ status: Status.Modification, score: 0, left: left, right: right });
                break;
            case 'R':
                name_statuses.push({ status: Status.Rename, score: parseInt(score), left: left, right: right });
                break;
            default:
                continue;
        }
    }

    return name_statuses;
}
