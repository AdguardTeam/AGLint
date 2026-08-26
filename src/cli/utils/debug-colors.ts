/**
 * Chalk-based color formatter for CLI debug output.
 */

import chalk from 'chalk';

import { type ColorFormatter } from '../../utils/debug';

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
 * Chalk-based color formatter for CLI debug output.
 * Provides rich colors using the chalk library.
 *
 * @param module Module name.
 * @param message Debug message.
 * @param elapsed Elapsed time in milliseconds.
 * @param printElapsed Whether to print elapsed time.
 * @param printTimestamp Formatted timestamp string or null if disabled.
 *
 * @returns Formatted debug message with chalk colors.
 */
export const chalkColorFormatter: ColorFormatter = (module, message, elapsed, printElapsed, printTimestamp) => {
    const colorFn = getModuleColor(module);
    const timestampPart = printTimestamp ? `${chalk.dim(`[${printTimestamp}]`)} ` : '';
    const elapsedPart = printElapsed ? ` ${chalk.dim(`(+${elapsed}ms)`)}` : '';

    return `${timestampPart}`
        + `${chalk.bold(colorFn(`[${module}]`))} `
        + `${message}${elapsedPart}`;
};
