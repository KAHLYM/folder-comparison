import { createHash } from 'crypto';

export class Cache {
    constructor(key: string, data: any) {
        this.hash = this._makeHash(key);
        this.data = data;
    };

    public get(): any {
        return this.data;
    }

    private _makeHash(data: any): string {
        return createHash("md5").update(data).digest("hex");
    }

    public test(key: string): boolean {
        return this.hash === this._makeHash(key);
    }

    public update(key: string, data: any): void {
        const hash: string = this._makeHash(key);
        if (hash !== this.hash) {
            this.hash = hash;
            this.data = data;
        }
    }

    private hash: string;
    private data: any;
}
