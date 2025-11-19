/* eslint-disable no-console */
/* eslint-disable max-classes-per-file */

import chalk from 'chalk';
import { format } from 'date-fns/format';

/**
 * Module name to chalk color function mapping for consistent coloring.
 */
const MODULE_COLORS: Record<string, (text: string) => string> = {
    cli: chalk.cyanBright,
    'pattern-matcher': chalk.greenBright,
    'file-scanner': chalk.yellowBright,
    'config-resolver': chalk.magentaBright,
    'linter-tree': chalk.blueBright,
    linter: chalk.magenta,
    cache: chalk.cyan,
    worker: chalk.green,
    executor: chalk.yellow,
    fixer: chalk.red,
    'rule-registry': chalk.blue,
    'tree-builder': chalk.blueBright,
    'ignore-matcher': chalk.dim,
};

/**
 * Gets a chalk color function for a module name. If no specific color is assigned,
 * generates a consistent color based on the module name hash.
 *
 * @param module Module name.
 *
 * @returns Chalk color function.
 */
function getModuleColor(module: string): (text: string) => string {
    if (MODULE_COLORS[module]) {
        return MODULE_COLORS[module];
    }

    // Generate a consistent color based on module name
    const colors = [
        chalk.red,
        chalk.green,
        chalk.yellow,
        chalk.blue,
        chalk.magenta,
        chalk.cyan,
        chalk.white,
    ];

    let hash = 0;
    for (let i = 0; i < module.length; i += 1) {
        hash = ((hash << 5) - hash) + module.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    return colors[Math.abs(hash) % colors.length]!;
}

/**
 * Formats a timestamp for debug output.
 *
 * @returns Formatted timestamp string.
 */
function formatTimestamp(): string {
    return format(new Date(), 'HH:mm:ss.SSS');
}

/**
 * Module-specific debugger that logs messages for a single module.
 * Provides a cleaner API by not requiring the module name on every call.
 */
export class ModuleDebugger {
    /**
     * Module name for this debugger.
     */
    private module: string;

    /**
     * Whether debug logging is enabled.
     */
    private enabled: boolean;

    /**
     * Reference to the parent logger.
     */
    private logger: DebugLogger;

    /**
     * Creates a new module-specific debugger.
     *
     * @param module Module name.
     * @param logger Parent debug logger.
     * @param enabled Whether debugging is enabled.
     */
    constructor(module: string, logger: DebugLogger, enabled: boolean) {
        this.module = module;
        this.logger = logger;
        this.enabled = enabled;
    }

    /**
     * Logs a debug message for this module.
     *
     * @param message Debug message.
     */
    public log(message: string): void {
        if (this.enabled) {
            this.logger.log(this.module, message);
        }
    }

    /**
     * Checks if debugging is enabled.
     *
     * @returns True if debugging is enabled.
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
}

/**
 * Debug logger class that provides colored console output for different modules.
 */
export class DebugLogger {
    /**
     * Whether debug logging is enabled.
     */
    private enabled: boolean;

    /**
     * Start time for elapsed time calculations.
     */
    private startTime: number;

    /**
     * Creates a new debug logger instance.
     *
     * @param enabled Whether debug logging is enabled.
     */
    constructor(enabled: boolean = false) {
        this.enabled = enabled;
        this.startTime = Date.now();
    }

    /**
     * Logs a debug message with colored module name and timestamp.
     *
     * @param module Module name.
     * @param message Debug message.
     */
    public log(module: string, message: string): void {
        if (!this.enabled) {
            return;
        }

        const elapsed = Date.now() - this.startTime;
        const colorFn = getModuleColor(module);
        const timestamp = formatTimestamp();

        console.log(
            `${chalk.dim(`[${timestamp}]`)} `
            + `${chalk.bold(colorFn(`[${module}]`))} `
            + `${message} ${chalk.dim(`(+${elapsed}ms)`)}`,
        );
    }

    /**
     * Creates a module-specific debugger instance.
     *
     * @param module Module name.
     *
     * @returns ModuleDebugger instance.
     */
    public createDebugger(module: string): ModuleDebugger {
        return new ModuleDebugger(module, this, this.enabled);
    }

    /**
     * Checks if debugging is enabled.
     *
     * @returns True if debugging is enabled.
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
}

/**
 * Creates a debug logger instance.
 *
 * @param enabled Whether debug logging is enabled.
 *
 * @returns DebugLogger instance.
 */
export function createDebugLogger(enabled: boolean): DebugLogger {
    return new DebugLogger(enabled);
}
