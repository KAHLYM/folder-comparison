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
    export const DefaultLevel: string = enumToString(_defaultLevel);

    let _level: Level = _defaultLevel;
    export function setLogLevel(level: string) {
        _level = stringToEnum(level);
    }

    let _channel = window.createOutputChannel("Folder Comparison");

    function enumToString(level: Level): string {
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

    function stringToEnum(level: string): Level {
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

    function log(level: Level, message: string): void {
        if (_level <= level) {
            _channel.appendLine(`${new Date().toISOString()} ${enumToString(level)} ${message}`);
        }
    }

    export function trace(message: string): void {
        log(Level.trace, message);
    }

    export function debug(message: string): void {
        log(Level.debug, message);
    }

    export function info(message: string): void {
        log(Level.info, message);
    }

    export function warning(message: string): void {
        log(Level.warning, message);
    }

    export function error(message: string): void {
        log(Level.error, message);
    }

    export function fatal(message: string): void {
        log(Level.fatal, message);
    }
}
