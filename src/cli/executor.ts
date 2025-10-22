import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Piscina from 'piscina';

import { type LintResultCache } from './cache';
import type { LinterCliConfig } from './cli-options';
import { type LinterCliScannedFile } from './file-scanner';
import type { LinterConsoleReporter } from './reporters/console';
import { hasLinterResultErrors } from './utils/has-errors';
import runLinterWorker, { type LinterWorkerResults } from './worker';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs linting sequentially on all files
 */
export async function runSequential(
    files: Array<LinterCliScannedFile>,
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
): Promise<boolean> {
    let hasErrors = false;

    reporter.onLintStart();

    for (const file of files) {
        const parsedFilePath = path.parse(file.filePath);

        reporter.onFileStart(parsedFilePath);

        // eslint-disable-next-line no-await-in-loop
        const { results } = await runLinterWorker({
            tasks: [
                {
                    filePath: file.filePath,
                    cwd,
                    linterConfig: file.linterConfig,
                },
            ],
            cliConfig,
        });

        if (!hasErrors && hasLinterResultErrors(results[0]!.linterResult)) {
            hasErrors = true;
        }

        reporter.onFileEnd(parsedFilePath, results[0]!.linterResult);
    }

    reporter.onLintEnd();

    return hasErrors;
}

/**
 * Runs linting sequentially on all files
 */
export async function runSequentialWithCache(
    files: Array<LinterCliScannedFile>,
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
    cache: LintResultCache,
): Promise<boolean> {
    let hasErrors = false;

    reporter.onLintStart();

    for (const file of files) {
        const parsedFilePath = path.parse(file.filePath);

        reporter.onFileStart(parsedFilePath);

        // Check if cached result is valid
        const cachedData = cache.getCachedResult(
            file.filePath,
            file.mtime,
            file.size,
            file.linterConfig,
            cliConfig.cacheStrategy!,
        );

        if (cachedData) {
            reporter.onFileEnd(parsedFilePath, cachedData.linterResult);

            if (!hasErrors && hasLinterResultErrors(cachedData.linterResult)) {
                hasErrors = true;
            }

            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const { results } = await runLinterWorker({
            tasks: [
                {
                    filePath: file.filePath,
                    cwd,
                    linterConfig: file.linterConfig,
                },
            ],
            cliConfig,
        });

        if (!hasErrors && hasLinterResultErrors(results[0]!.linterResult)) {
            hasErrors = true;
        }

        // Store result in cache
        cache.setCachedResult(
            file.filePath,
            file.mtime,
            file.size,
            file.linterConfig,
            results[0]!.linterResult,
        );

        reporter.onFileEnd(parsedFilePath, results[0]!.linterResult);
    }

    reporter.onLintEnd();

    return hasErrors;
}

/**
 * Runs linting in parallel using worker threads
 */
export async function runParallel(
    buckets: LinterCliScannedFile[][],
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
    maxThreads: number,
): Promise<boolean> {
    let hasErrors = false;

    const piscina = new Piscina({
        filename: path.resolve(__dirname, './worker.js'),
        idleTimeout: 30_000,
        minThreads: Math.min(1, maxThreads),
        maxThreads,
    });

    reporter.onLintStart();

    await Promise.all(
        buckets.map(async (bucket) => {
            if (bucket.length === 0) {
                return;
            }

            for (const f of bucket) {
                reporter.onFileStart(path.parse(f.filePath));
            }

            const result = await piscina.run({
                tasks: bucket.map((f) => ({
                    filePath: f.filePath,
                    cwd,
                    linterConfig: f.linterConfig,
                })),
                cliConfig,
            }) as LinterWorkerResults;

            for (let i = 0; i < bucket.length; i += 1) {
                reporter.onFileEnd(path.parse(bucket[i]!.filePath), result.results[i]!.linterResult);

                if (!hasErrors && hasLinterResultErrors(result.results[i]!.linterResult)) {
                    hasErrors = true;
                }
            }
        }),
    );

    reporter.onLintEnd();

    return hasErrors;
}

/**
 * Runs linting in parallel using worker threads with cache support
 */
export async function runParallelWithCache(
    buckets: LinterCliScannedFile[][],
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
    maxThreads: number,
    cache: LintResultCache,
): Promise<boolean> {
    let hasErrors = false;

    const piscina = new Piscina({
        filename: path.resolve(__dirname, './worker.js'),
        idleTimeout: 30_000,
        minThreads: Math.min(1, maxThreads),
        maxThreads,
    });

    reporter.onLintStart();

    await Promise.all(
        buckets.map(async (bucket) => {
            if (bucket.length === 0) {
                return;
            }

            // Report file start for all files
            for (const f of bucket) {
                reporter.onFileStart(path.parse(f.filePath));
            }

            // Send all files to worker with cache data
            const workerResults = await piscina.run({
                tasks: bucket.map((f) => {
                    const cachedData = cache.getCachedResult(
                        f.filePath,
                        f.mtime,
                        f.size,
                        f.linterConfig,
                        cliConfig.cacheStrategy!,
                    );

                    return {
                        filePath: f.filePath,
                        cwd,
                        linterConfig: f.linterConfig,
                        fileCacheData: cachedData ?? undefined,
                    };
                }),
                cliConfig,
            }) as LinterWorkerResults;

            // Process all results
            for (let i = 0; i < bucket.length; i += 1) {
                const file = bucket[i]!;
                const workerResult = workerResults.results[i]!;

                // Update cache if not from cache or content hash changed
                if (!workerResult.fromCache || workerResult.fileHash) {
                    cache.setCachedResult(
                        file.filePath,
                        file.mtime,
                        file.size,
                        file.linterConfig,
                        workerResult.linterResult,
                        workerResult.fileHash,
                    );
                }

                // Report result
                reporter.onFileEnd(path.parse(file.filePath), workerResult.linterResult);

                if (!hasErrors && hasLinterResultErrors(workerResult.linterResult)) {
                    hasErrors = true;
                }
            }
        }),
    );

    reporter.onLintEnd();

    return hasErrors;
}
