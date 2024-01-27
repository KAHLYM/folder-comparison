import * as assert from 'assert';
import { isProduction } from './config';

suite('config', () => {

    suite('isProduction', () => {
        test('should be false for development', () => {
            assert.equal(false, isProduction());
        });
    });
});
