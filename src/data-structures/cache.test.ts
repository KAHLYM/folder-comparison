import * as assert from 'assert';
import { Cache } from './cache';

suite('cache', () => {

    function isHex(hash: string): boolean {
        return /[0-9A-F]*/.test(hash);
    }

    suite('constructor', () => {
        test("hashes key and caches data", async () => {
            const cache: Cache = new Cache("key", "data");
            assert.equal(true, isHex(cache._hash));
            assert.equal("data", cache._data);
        });
    });

    suite('get', () => {
        test("returns data", async () => {
            const cache: Cache = new Cache("key", "data");
            assert.equal("data", cache.get());
        });
    });

    suite('_makeHash', () => {
        [
            { data: "" },
            { data: "test string" },
        ].forEach(function (item) {
            test("returns hexidecimal hash given '" + item.data + "'", async () => {
            assert.equal(true, isHex(Cache._makeHash(item.data)));
        });
        });
    });

    suite('test', () => {
        test("returns false when hash is not equal", async () => {
            const cache: Cache = new Cache("key", "data");
            assert.equal(false, cache.test("invalid"));
        });

        test("returns true when hash is equal", async () => {
            const cache: Cache = new Cache("key", "data");
            assert.equal(true, cache.test("key"));
        });
    });

    suite('update', () => {
        test("does not update hash and data if key is equal", async () => {
            const cache: Cache = new Cache("key", "data");
            const cachedHash: string = cache._hash;
            const cachedData: string = cache._data;

            cache.update("key", "data");

            assert.equal(cachedHash, cache._hash);
            assert.equal(cachedData, cache._data);
            assert.equal("data", cache._data);
        });

        test("does updates hash and data if key is not equal", async () => {
            const cache: Cache = new Cache("key", "data");
            const cachedHash: string = cache._hash;
            const cachedData: string = cache._data;

            cache.update("new key", "new data");

            assert.notEqual(cachedHash, cache._hash);
            assert.notEqual(cachedData, cache._data);
            assert.equal("new data", cache._data);
        });
    });
});
