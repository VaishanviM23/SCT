import { LogLevel } from "@azure/msal-browser";


export function loggerCallback(logLevel: LogLevel, message: string, piiEnabled: boolean) {
    if (logLevel === LogLevel.Error) {
        console.error(message);
        console.trace();
    } else if (logLevel === LogLevel.Warning) {
        console.warn(message);
    } else if (logLevel === LogLevel.Info || logLevel === LogLevel.Verbose) {
         console.info(message);
    }
}
