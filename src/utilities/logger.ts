import { window } from 'vscode';

export namespace logger {

    export enum Level {
        trace = 1,
        debug,
        info,
        warning,
        error,
        fatal,
    }

    const _defaultLevel = Level.info;
    export const defaultLevel: string = _enumToString(_defaultLevel);

    export let _level: Level = _defaultLevel;
    export function setLogLevel(level: string) {
        _level = _stringToEnum(level);
    }

    let _channel = window.createOutputChannel("Folder Comparison");

    export function _enumToString(level: Level): string {
        switch (level) {
            case Level.trace:
                return "T";
            case Level.debug:
                return "D";
            case Level.info:
                return "I";
            case Level.warning:
                return "W";
            case Level.error:
                return "E";
            case Level.fatal:
                return "F";
        }
    }

    export function _stringToEnum(level: string): Level {
        switch (level) {
            case "Trace":
                return Level.trace;
            case "Debug":
                return Level.debug;
            case "Info":
                return Level.info;
            case "Warning":
                return Level.warning;
            case "Error":
                return Level.error;
            case "Fatal":
                return Level.fatal;
            default:
                return Level.info;
        }
    }

    /* istanbul ignore next: difficult to unit test */
    function log(level: Level, message: string): void {
        if (_level <= level) {
            _channel.appendLine(`${new Date().toISOString()} ${_enumToString(level)} ${message}`);
        }
    }

    /* istanbul ignore next: difficult to unit test */
    export function trace(message: string): void {
        log(Level.trace, message);
    }

    /* istanbul ignore next: difficult to unit test */
    export function debug(message: string): void {
        log(Level.debug, message);
    }

    /* istanbul ignore next: difficult to unit test */
    export function info(message: string): void {
        log(Level.info, message);
    }

    /* istanbul ignore next: difficult to unit test */
    export function warning(message: string): void {
        log(Level.warning, message);
    }

    /* istanbul ignore next: difficult to unit test */
    export function error(message: string): void {
        log(Level.error, message);
    }

    /* istanbul ignore next: difficult to unit test */
    export function fatal(message: string): void {
        log(Level.fatal, message);
    }
}
