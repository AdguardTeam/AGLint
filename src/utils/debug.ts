/* eslint-disable no-console */
/* eslint-disable max-classes-per-file */

/**
 * @file Platform-agnostic debug logging utilities.
 * Can be used in CLI (Node.js), linter (platform-agnostic), VS Code extensions, etc.
 */

/**
 * Logger function type for outputting debug messages.
 * Takes a formatted message string.
 */
export type Logger = (message: string) => void;

/**
 * Color formatter function type for customizing debug output.
 * Takes module name, message, elapsed time, and optional timestamp.
 * Returns formatted string with optional ANSI color codes.
 */
export type ColorFormatter = (
    module: string,
    message: string,
    elapsed: number,
    printElapsed: boolean,
    printTimestamp: string | null,
) => string | null;

/**
 * Options for creating a debug logger.
 */
export interface DebugOptions {
    /**
     * Whether debug logging is enabled.
     */
    enabled: boolean;

    /**
     * Whether to include timestamps in debug messages.
     * Defaults to true. Set to false if your logger (e.g., VS Code) already adds timestamps.
     */
    printTimestamps?: boolean;

    /**
     * Whether to include elapsed time in debug messages.
     * Defaults to true. Set to false if your logger (e.g., VS Code) already adds elapsed time.
     */
    printElapsed?: boolean;

    /**
     * Whether to use colored output.
     * When true, uses colorFormatter if provided, otherwise uses simple ANSI colors.
     */
    colors?: boolean;

    /**
     * Optional custom logger function.
     * Defaults to console.log. Can be set to VS Code logger, custom logger, etc.
     */
    logger?: Logger;

    /**
     * Optional custom color formatter function.
     * If provided and colors=true, this will be used instead of default ANSI colors.
     */
    colorFormatter?: ColorFormatter;
}

/**
 * Default ANSI color formatter.
 * Uses ANSI escape codes for colored terminal output.
 *
 * @param module Module name.
 * @param message Debug message.
 * @param elapsed Elapsed time in milliseconds.
 * @param printElapsed Whether to print elapsed time.
 * @param printTimestamp Formatted timestamp string or null if disabled.
 *
 * @returns Formatted message with ANSI color codes.
 */
const defaultColorFormatter: ColorFormatter = (module, message, elapsed, printElapsed, printTimestamp) => {
    // Simple ANSI colors (works everywhere)
    const dim = '\x1b[2m';
    const cyan = '\x1b[36m';
    const bold = '\x1b[1m';
    const reset = '\x1b[0m';

    const timestampPart = printTimestamp ? `${dim}[${printTimestamp}]${reset} ` : '';
    const elapsedPart = printElapsed ? ` ${dim}(+${elapsed}ms)${reset}` : '';
    return `${timestampPart}${cyan}${bold}[${module}]${reset} ${message}${elapsedPart}`;
};

/**
 * Module-specific debugger.
 * Provides a cleaner API by not requiring the module name on every call.
 *
 * @example
 * ```typescript
 * const debug = new Debug({ enabled: true });
 * const moduleDebug = debug.module('my-module');
 *
 * // Simple logging without module name
 * moduleDebug.log('Processing started');
 * moduleDebug.log('Processing completed');
 * ```
 */
export class ModuleDebug {
    /**
     * Module name for this debugger.
     */
    private moduleName: string;

    /**
     * Reference to the parent debug logger.
     */
    private debug: Debug;

    /**
     * Creates a new module-specific debugger.
     *
     * @param moduleName Module name.
     * @param debug Parent debug logger.
     */
    constructor(moduleName: string, debug: Debug) {
        this.moduleName = moduleName;
        this.debug = debug;
    }

    /**
     * Logs a debug message for this module.
     *
     * @param message Debug message.
     */
    public log(message: string): void {
        this.debug.log(this.moduleName, message);
    }

    /**
     * Creates a sub-module debugger with a nested name.
     *
     * @param name Sub-module name (will be appended to parent module name).
     *
     * @returns ModuleDebug instance for the sub-module.
     *
     * @example
     * ```typescript
     * const linterDebug = debug.module('linter');
     * const ruleDebug = linterDebug.module('rule:no-short-rules');
     * // Logs as: [linter:rule:no-short-rules]
     * ```
     */
    public module(name: string): ModuleDebug {
        return new ModuleDebug(`${this.moduleName}:${name}`, this.debug);
    }
}

/**
 * Platform-agnostic debug logger.
 * Can be used across CLI, linter, and external tools like VS Code extensions.
 *
 * @example
 * ```typescript
 * // In CLI with colors
 * const debug = new Debug({ enabled: true, colors: true });
 * const cliDebug = debug.module('cli');
 * cliDebug.log('Starting CLI');
 *
 * // In linter without colors
 * const debug = new Debug({ enabled: true });
 * const linterDebug = debug.module('linter');
 * linterDebug.log('Linting file');
 *
 * // In VS Code extension
 * const debug = new Debug({ enabled: true, colors: false });
 * const vscodeDebug = debug.module('vscode-linter');
 * vscodeDebug.log('Processing document');
 * ```
 */
export class Debug {
    /**
     * Whether debug logging is enabled.
     */
    private enabled: boolean;

    /**
     * Whether to include timestamps.
     */
    private printTimestamps: boolean;

    /**
     * Whether to include elapsed time.
     */
    private printElapsed: boolean;

    /**
     * Whether to use colored output.
     */
    private colors: boolean;

    /**
     * Start time for elapsed time calculations.
     */
    private startTime: number;

    /**
     * Logger function for output.
     */
    private logger: Logger;

    /**
     * Optional custom color formatter.
     */
    private colorFormatter?: ColorFormatter;

    /**
     * Creates a new debug logger instance.
     *
     * @param options Debug options including enabled state and color settings.
     */
    constructor(options: DebugOptions) {
        this.enabled = options.enabled;
        this.printTimestamps = options.printTimestamps ?? true;
        this.printElapsed = options.printElapsed ?? true;
        this.colors = options.colors ?? false;
        this.startTime = Date.now();
        this.logger = options.logger ?? console.log;
        this.colorFormatter = options.colorFormatter;
    }

    /**
     * Creates a module-specific debugger instance.
     *
     * @param name Module name.
     *
     * @returns ModuleDebug instance.
     */
    public module(name: string): ModuleDebug {
        return new ModuleDebug(name, this);
    }

    /**
     * Enables debug logging.
     */
    public enable(): void {
        this.enabled = true;
    }

    /**
     * Disables debug logging.
     */
    public disable(): void {
        this.enabled = false;
    }

    /**
     * Checks if debug logging is currently enabled.
     *
     * @returns True if debug logging is enabled, false otherwise.
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Logs a debug message with module name and optional timestamp.
     *
     * @param moduleName Module name.
     * @param message Debug message.
     */
    public log(moduleName: string, message: string): void {
        if (!this.enabled) {
            return;
        }

        const elapsed = Date.now() - this.startTime;
        const timestamp = this.printTimestamps ? Debug.formatTimestamp() : null;

        if (this.colors) {
            const formatter = this.colorFormatter || defaultColorFormatter;
            const formatted = formatter(moduleName, message, elapsed, this.printElapsed, timestamp);
            if (formatted) {
                this.logger(formatted);
            }
        } else {
            const timestampPart = timestamp ? `[${timestamp}] ` : '';
            const elapsedPart = this.printElapsed ? ` (+${elapsed}ms)` : '';
            this.logger(`${timestampPart}[${moduleName}] ${message}${elapsedPart}`);
        }
    }

    /**
     * Formats a timestamp using native Date methods (no external dependencies).
     *
     * @returns Formatted timestamp string in HH:mm:ss.SSS format.
     */
    private static formatTimestamp(): string {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
}

/**
 * Creates a debug logger instance.
 *
 * @param options Debug options.
 *
 * @returns Debug instance.
 */
export function createDebug(options: DebugOptions): Debug {
    return new Debug(options);
}
