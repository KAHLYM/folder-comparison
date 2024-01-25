import { createHash } from 'crypto';

export class Cache {
    constructor(key: string, data: any) {
        this._hash = Cache._makeHash(key);
        this._data = data;
    };

    public get(): any {
        return this._data;
    }

    public static _makeHash(data: any): string {
        return createHash("md5").update(data).digest("hex");
    }

    public test(key: string): boolean {
        return this._hash === Cache._makeHash(key);
    }

    public update(key: string, data: any): void {
        const hash: string = Cache._makeHash(key);
        if (hash !== this._hash) {
            this._hash = hash;
            this._data = data;
        }
    }

    public _hash: string;
    public _data: any;
}
