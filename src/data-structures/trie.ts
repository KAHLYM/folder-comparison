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

    public getRoot(): FileSystemTrieNode {
        return this.root;
    }

    constructor() { }

    protected splitPath(path: string): string[] {
        return path ? path.split('/') : [];
    }

    public add(path: string, content: any, intermediate: any, update: Function): void {
        let node = this.root;

        const keys: string[] = this.splitPath(path);
        for (const key of keys) {
            if (node.children[key] === undefined) {
                node.children[key] = new FileSystemTrieNode(key, intermediate);
            } else {
                node.children[key].content = update(node.children[key].content, intermediate);
            }

            node = node.children[key];
        }

        node.content = content;
    }

    public exists(path: string): boolean {
        let node = this.root;

        const keys: string[] = this.splitPath(path);
        for (const key of keys) {
            if (node.children[key] === undefined) {
                return false;
            }

            node = node.children[key];
        }

        return true;
    }

    public getContent(path: string): any {
        let node = this.root;

        const keys: string[] = this.splitPath(path);
        for (const key of keys) {
            node = node.children[key];
        }

        return node.content;
    }

    public getChildren(path: string): FileSystemTrieNode[] {
        let node = this.root;

        const keys: string[] = this.splitPath(path);
        for (const key of keys) {
            node = node.children[key];
        }

        return Object.values(node.children);
    }
}
