import * as path from "path";

export function toUnix(filepath: string): string {
    return filepath.split(path.sep).join(path.posix.sep);
}

export function trimLeadingPathSeperators(filepath: string): string {
    while (filepath.at(0) === path.posix.sep || filepath.at(0) === path.sep) {
        filepath = filepath.substring(1);
    }
    return filepath;
}
