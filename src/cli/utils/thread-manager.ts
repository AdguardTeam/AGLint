import os from 'node:os';

import * as v from 'valibot';

/**
 * Returns the number of available threads for parallel processing.
 *
 * Uses `os.availableParallelism` if available, otherwise falls back to the number of CPU cores.
 *
 * @returns Number of available threads.
 */
const getAvailableThreads = () => os.availableParallelism?.() ?? os.cpus().length;

/**
 * Schema for validating thread configuration options.
 * Accepts 'off', 'auto', or a number (as string or number) between 1 and available CPU cores.
 */
export const threadOptionSchema = v.union(
    [
        // String literals: 'off' or 'auto'
        v.pipe(v.string(), v.toLowerCase(), v.union([v.literal('off'), v.literal('auto')])),
        // Numeric string: validate integer format and convert to number
        v.pipe(
            v.string(),
            v.regex(/^[1-9]\d*$/, 'Must be a positive integer without leading zeros'),
            v.transform((val) => Number.parseInt(val, 10)),
            v.minValue(1),
            v.maxValue(getAvailableThreads()),
        ),
        // Direct number input (for programmatic use)
        v.pipe(v.number(), v.integer('Must be an integer'), v.minValue(1), v.maxValue(getAvailableThreads())),
    ],
    `Must be "off", "auto", or a positive integer between 1 and ${getAvailableThreads()}`,
);

/**
 * Valid thread configuration options.
 * Can be 'off' (single-threaded), 'auto' (half of available cores), or a specific number.
 */
export type ThreadsOption = v.InferOutput<typeof threadOptionSchema>;

/**
 * Resolved thread configuration.
 */
export interface ThreadConfig {
    /**
     * Maximum number of worker threads to use.
     */
    maxThreads: number;

    /**
     * Whether auto mode was selected (affects small project detection).
     */
    isAutoMode: boolean;
}

/**
 * Calculates the effective number of threads to use based on CLI option.
 *
 * - 'off': Uses 1 thread (sequential processing)
 * - 'auto': Uses half of available CPU cores
 * - number: Uses the specified number of threads.
 *
 * @param threadsOpt Thread option from CLI.
 *
 * @returns Resolved thread configuration.
 */
export function calculateThreads(threadsOpt: ThreadsOption): ThreadConfig {
    const autoThreads = Math.max(1, Math.floor(getAvailableThreads() / 2));

    let maxThreads: number;
    const isAutoMode = threadsOpt === 'auto';

    if (threadsOpt === 'off') {
        maxThreads = 1;
    } else if (threadsOpt === 'auto') {
        maxThreads = autoThreads;
    } else {
        maxThreads = Math.max(1, threadsOpt | 0);
    }

    return { maxThreads, isAutoMode };
}

/**
 * Determines if a project should run sequentially based on size.
 *
 * Projects with fewer than 5 files or less than 5MB total size
 * are considered small and benefit from sequential processing.
 *
 * @param fileCount Number of files to lint.
 * @param totalSize Total size of all files in bytes.
 *
 * @returns True if the project should run sequentially.
 */
export function isSmallProject(fileCount: number, totalSize: number): boolean {
    return fileCount < 5 || totalSize < 5 * 1024 * 1024;
}
