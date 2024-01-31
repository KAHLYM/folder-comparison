import { toUnix } from "./path";

export function removePrefixes(path: string, prefixes: string[]): string {
    path = toUnix(path);

    for (const prefix of prefixes) {
        path = path.replace(toUnix(prefix), "");
    }

    return path;
}