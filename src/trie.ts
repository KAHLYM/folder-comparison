export class FileSystemTrieNode {
    public key: string;
    public content: any;
    public children: Record<string, FileSystemTrieNode> = {};

    constructor(key: string, content: any) {
        this.key = key;
        this.content = content;
    }
}

export class FileSystemTrie {
    protected root: FileSystemTrieNode = new FileSystemTrieNode("", null);

    constructor() { }

    private splitPath(path: string): string[] {
        return path.split('/');
    }

    add(path: string, content: any): void {
        let node = this.root;

        const keys: string[] = this.splitPath(path)
        for (const key of keys) {
            if (node.children[key] == null) {
                node.children[key] = new FileSystemTrieNode(key, null);
            }

            node = node.children[key];
        }

        node.content = content;
    }

    exists(path: string): boolean {
        let node = this.root;

        const keys: string[] = this.splitPath(path);
        for (const key of keys) {
            if (node.children[key] == null) {
                return false;
            }

            node = node.children[key];
        }

        return true;
    }

    get(path: string): any {
        let node = this.root;

        const keys: string[] = this.splitPath(path);
        for (const key of keys) {
            node = node.children[key];
        }

        return node.content;
    }
}
