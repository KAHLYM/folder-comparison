import { window } from 'vscode';

export namespace logger {

    export enum Level {
        Trace = 1,
        Debug,
        Info,
        Warning,
        Error,
        Fatal,
    }

    const _defaultLevel = Level.Info;
    export const DefaultLevel: string = enumToString(_defaultLevel);

    let _level: Level = _defaultLevel;
    export function setLogLevel(level: string) {
        _level = stringToEnum(level);
    }

    let _channel = window.createOutputChannel("Folder Comparison");

    function enumToString(level: Level): string {
        switch (level) {
            case Level.Trace:
                return "T";
            case Level.Debug:
                return "D";
            case Level.Info:
                return "I";
            case Level.Warning:
                return "W";
            case Level.Error:
                return "E";
            case Level.Fatal:
                return "F";
        }
    }

    function stringToEnum(level: string): Level {
        switch (level) {
            case "Trace":
                return Level.Trace;
            case "Debug":
                return Level.Debug;
            case "Info":
                return Level.Info;
            case "Warning":
                return Level.Warning;
            case "Error":
                return Level.Error;
            case "Fatal":
                return Level.Fatal;
            default:
                return Level.Info;
        }
    }

    function log(level: Level, message: string): void {
        if (_level <= level) {
            _channel.appendLine(`${new Date().toISOString()} ${enumToString(level)} ${message}`);
        }
    }

    export function trace(message: string): void {
        log(Level.Trace, message);
    }

    export function debug(message: string): void {
        log(Level.Debug, message);
    }

    export function info(message: string): void {
        log(Level.Info, message);
    }

    export function warning(message: string): void {
        log(Level.Warning, message);
    }

    export function error(message: string): void {
        log(Level.Error, message);
    }

    export function fatal(message: string): void {
        log(Level.Fatal, message);
    }
}
