import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Piscina from 'piscina';

import { hasLinterResultErrors } from '../linter/linter-result';

import { type LintResultCache } from './cache';
import type { LinterCliConfig } from './cli-options';
import type { LinterConsoleReporter } from './reporters/console';
import { type ScannedFile } from './utils/file-scanner';
import runLinterWorker, { type LinterWorkerResults } from './worker';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs linting sequentially on all files without caching.
 *
 * Processes files one at a time in the main thread. Suitable for
 * small projects or when running in single-threaded mode.
 *
 * @param files Array of scanned files with their configurations.
 * @param cliConfig CLI configuration options.
 * @param reporter Reporter for outputting results.
 * @param cwd Current working directory.
 *
 * @returns True if any file has errors, false otherwise.
 */
export async function runSequential(
    files: Array<ScannedFile>,
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
): Promise<boolean> {
    let hasErrors = false;

    if (cliConfig.debug) {
        // eslint-disable-next-line no-console
        console.log(`[executor] Starting sequential processing of ${files.length} file(s)`);
    }

    reporter.onLintStart();

    for (const file of files) {
        const parsedFilePath = path.parse(file.path);

        reporter.onFileStart(parsedFilePath);

        // eslint-disable-next-line no-await-in-loop
        const { results } = await runLinterWorker({
            tasks: [
                {
                    filePath: file.path,
                    cwd,
                    linterConfig: file.config,
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
 * Runs linting sequentially with cache support.
 *
 * Checks cache for each file before linting. Skips linting if a valid
 * cached result exists. Updates cache with new results.
 *
 * @param files Array of scanned files with their configurations.
 * @param cliConfig CLI configuration options.
 * @param reporter Reporter for outputting results.
 * @param cwd Current working directory.
 * @param cache Cache instance for storing and retrieving results.
 *
 * @returns True if any file has errors, false otherwise.
 */
export async function runSequentialWithCache(
    files: Array<ScannedFile>,
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
    cache: LintResultCache,
): Promise<boolean> {
    let hasErrors = false;
    let cacheHits = 0;
    let cacheMisses = 0;

    if (cliConfig.debug) {
        // eslint-disable-next-line no-console
        console.log(`[executor] Starting sequential processing with cache of ${files.length} file(s)`);
    }

    reporter.onLintStart();

    for (const file of files) {
        const parsedFilePath = path.parse(file.path);

        reporter.onFileStart(parsedFilePath);

        // Check if cached result is valid
        const cachedData = cache.getCachedResult(
            file.path,
            file.mtime,
            file.size,
            file.config,
            cliConfig.cacheStrategy!,
        );

        if (cachedData) {
            // Cache hit - use cached result
            cacheHits += 1;
            if (cliConfig.debug) {
                // eslint-disable-next-line no-console
                console.log(`[executor] Cache HIT for: ${file.path}`);
            }
            reporter.onFileEnd(parsedFilePath, cachedData.linterResult);

            if (!hasErrors && hasLinterResultErrors(cachedData.linterResult)) {
                hasErrors = true;
            }
        } else {
            // Cache miss - run linter
            cacheMisses += 1;
            if (cliConfig.debug) {
                // eslint-disable-next-line no-console
                console.log(`[executor] Cache MISS for: ${file.path}`);
            }

            // eslint-disable-next-line no-await-in-loop
            const { results } = await runLinterWorker({
                tasks: [
                    {
                        filePath: file.path,
                        cwd,
                        linterConfig: file.config,
                    },
                ],
                cliConfig,
            });

            if (!hasErrors && hasLinterResultErrors(results[0]!.linterResult)) {
                hasErrors = true;
            }

            // Store result in cache
            cache.setCachedResult(
                file.path,
                file.mtime,
                file.size,
                file.config,
                results[0]!.linterResult,
            );

            reporter.onFileEnd(parsedFilePath, results[0]!.linterResult);
        }
    }

    reporter.onLintEnd();

    if (cliConfig.debug) {
        const hitRate = files.length > 0 ? ((cacheHits / files.length) * 100).toFixed(1) : '0.0';
        // eslint-disable-next-line no-console
        console.log(
            '[executor] Sequential processing with cache completed: '
            + `${cacheHits} hit(s), ${cacheMisses} miss(es) (${hitRate}% hit rate)`,
        );
    }

    return hasErrors;
}

/**
 * Runs linting in parallel using worker threads without caching.
 *
 * Distributes file buckets across worker threads for concurrent processing.
 * Each bucket is processed by a separate worker, improving performance for
 * large projects.
 *
 * @param buckets File buckets distributed for parallel processing.
 * @param cliConfig CLI configuration options.
 * @param reporter Reporter for outputting results.
 * @param cwd Current working directory.
 * @param maxThreads Maximum number of worker threads to use.
 *
 * @returns True if any file has errors, false otherwise.
 */
export async function runParallel(
    buckets: ScannedFile[][],
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
    maxThreads: number,
): Promise<boolean> {
    let hasErrors = false;

    if (cliConfig.debug) {
        const totalFiles = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
        // eslint-disable-next-line no-console
        console.log(
            `[executor] Starting parallel processing of ${totalFiles} file(s) `
            + `in ${buckets.length} bucket(s) with ${maxThreads} thread(s)`,
        );
    }

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
                reporter.onFileStart(path.parse(f.path));
            }

            const result = await piscina.run({
                tasks: bucket.map((f) => ({
                    filePath: f.path,
                    cwd,
                    linterConfig: f.config,
                })),
                cliConfig,
            }) as LinterWorkerResults;

            for (let i = 0; i < bucket.length; i += 1) {
                reporter.onFileEnd(path.parse(bucket[i]!.path), result.results[i]!.linterResult);

                if (!hasErrors && hasLinterResultErrors(result.results[i]!.linterResult)) {
                    hasErrors = true;
                }
            }
        }),
    );

    reporter.onLintEnd();

    if (cliConfig.debug) {
        // eslint-disable-next-line no-console
        console.log('[executor] Parallel processing completed');
    }

    return hasErrors;
}

/**
 * Runs linting in parallel using worker threads with cache support.
 *
 * Distributes files across workers while checking cache for each file.
 * Workers receive cache data and can skip linting cached files. Updates
 * cache with new results after processing.
 *
 * @param buckets File buckets distributed for parallel processing.
 * @param cliConfig CLI configuration options.
 * @param reporter Reporter for outputting results.
 * @param cwd Current working directory.
 * @param maxThreads Maximum number of worker threads to use.
 * @param cache Cache instance for storing and retrieving results.
 *
 * @returns True if any file has errors, false otherwise.
 */
export async function runParallelWithCache(
    buckets: ScannedFile[][],
    cliConfig: LinterCliConfig,
    reporter: LinterConsoleReporter,
    cwd: string,
    maxThreads: number,
    cache: LintResultCache,
): Promise<boolean> {
    let hasErrors = false;
    let cacheHits = 0;
    let cacheMisses = 0;

    if (cliConfig.debug) {
        const totalFiles = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
        // eslint-disable-next-line no-console
        console.log(
            `[executor] Starting parallel processing with cache of ${totalFiles} file(s) `
            + `in ${buckets.length} bucket(s) with ${maxThreads} thread(s)`,
        );
    }

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
                reporter.onFileStart(path.parse(f.path));
            }

            // Send all files to worker with cache data
            const workerResults = await piscina.run({
                tasks: bucket.map((f) => {
                    const cachedData = cache.getCachedResult(
                        f.path,
                        f.mtime,
                        f.size,
                        f.config,
                        cliConfig.cacheStrategy!,
                    );

                    return {
                        filePath: f.path,
                        cwd,
                        linterConfig: f.config,
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
                        file.path,
                        file.mtime,
                        file.size,
                        file.config,
                        workerResult.linterResult,
                        workerResult.fileHash,
                    );
                    cacheMisses += 1;
                } else {
                    cacheHits += 1;
                }

                // Report result
                reporter.onFileEnd(path.parse(file.path), workerResult.linterResult);

                if (!hasErrors && hasLinterResultErrors(workerResult.linterResult)) {
                    hasErrors = true;
                }
            }
        }),
    );

    reporter.onLintEnd();

    if (cliConfig.debug) {
        const totalFiles = cacheHits + cacheMisses;
        const hitRate = totalFiles > 0 ? ((cacheHits / totalFiles) * 100).toFixed(1) : '0.0';
        // eslint-disable-next-line no-console
        console.log(
            '[executor] Parallel processing with cache completed: '
            + `${cacheHits} hit(s), ${cacheMisses} miss(es) (${hitRate}% hit rate)`,
        );
    }

    return hasErrors;
}
