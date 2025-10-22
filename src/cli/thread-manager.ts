import os from 'node:os';

import * as v from 'valibot';

const getAvailableThreads = () => os.availableParallelism?.() ?? os.cpus().length;

export const threadOptionSchema = v.union([
    v.pipe(v.string(), v.toLowerCase(), v.union([v.literal('off'), v.literal('auto')])),
    v.pipe(v.number(), v.minValue(1), v.maxValue(getAvailableThreads())),
]);

export type ThreadsOption = v.InferOutput<typeof threadOptionSchema>;

export interface ThreadConfig {
    maxThreads: number;
    isAutoMode: boolean;
}

/**
 * Calculates the effective number of threads to use based on CLI option
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
 * Determines if a project should run sequentially based on size
 */
export function isSmallProject(fileCount: number, totalSize: number): boolean {
    return fileCount < 5 || totalSize < 5 * 1024 * 1024;
}
