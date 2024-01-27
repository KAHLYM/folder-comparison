import * as path from "path";

export function toUnix(filepath: string): string {
    return filepath.split(path.sep).join(path.posix.sep);
}
