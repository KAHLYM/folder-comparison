import * as assert from 'assert';
import { logger } from './logger';

suite('logger', () => {

    suite('setLogLevel', () => {
        test("updates log level", () => {
            assert.equal(logger.Level.info, logger._level);
            logger.setLogLevel("Trace");
            assert.equal(logger.Level.trace, logger._level);
        });
    });

    suite('enumToString', () => {
        [
            { string: "T", level: logger.Level.trace },
            { string: "D", level: logger.Level.debug },
            { string: "I", level: logger.Level.info },
            { string: "W", level: logger.Level.warning },
            { string: "E", level: logger.Level.error },
            { string: "F", level: logger.Level.fatal },
        ].forEach(function (item) {
            test("returns '" + item.string + "' when passed '" + item.level + "'", () => {
                assert.equal(item.string, logger._enumToString(item.level));
            });
        });
    });

    suite('stringToEnum', () => {
        [
            { string: "Trace", level: logger.Level.trace },
            { string: "Debug", level: logger.Level.debug },
            { string: "Info", level: logger.Level.info },
            { string: "Warning", level: logger.Level.warning },
            { string: "Error", level: logger.Level.error },
            { string: "Fatal", level: logger.Level.fatal },
            { string: "Invalid", level: logger.Level.info, },
        ].forEach(function (item) {
            test("returns '" + item.level + "' when passed '" + item.string + "'", () => {
                assert.equal(item.level, logger._stringToEnum(item.string));
            });
        });
    });
});
