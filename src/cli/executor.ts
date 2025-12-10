import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Piscina from 'piscina';

import { hasErrors } from '../linter/linter-helpers';
import { Debug } from '../utils/debug';

import { type LintResultCache } from './cache';
import type { LinterCliConfig } from './cli-options';
import type { LinterCliReporter } from './reporters/reporter';
import { chalkColorFormatter } from './utils/debug-colors';
import { type ScannedFile } from './utils/file-scanner';
import runLinterWorker, { type LinterWorkerResults } from './worker';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs linting sequentially on all files.
 *
 * Processes files one at a time in the main thread. Suitable for
 * small projects or when running in single-threaded mode.
 * If cache is enabled, checks cache before linting and updates it with results.
 *
 * @param files Array of scanned files with their configurations.
 * @param cliConfig CLI configuration options.
 * @param reporter Reporter for outputting results.
 * @param cwd Current working directory.
 * @param cache Optional cache instance for storing and retrieving results.
 *
 * @returns True if any file has errors, false otherwise.
 */
export async function runSequential(
    files: Array<ScannedFile>,
    cliConfig: LinterCliConfig,
    reporter: LinterCliReporter,
    cwd: string,
    cache?: LintResultCache,
): Promise<boolean> {
    const debug = new Debug({
        enabled: cliConfig.debug || false,
        colors: cliConfig.color ?? true,
        colorFormatter: chalkColorFormatter,
    });
    const executorDebug = debug.module('executor');

    let foundErrors = false;
    let cacheHits = 0;
    let cacheMisses = 0;

    const cacheEnabled = cache && cliConfig.cache;
    executorDebug.log(
        `Starting sequential processing${cacheEnabled ? ' with cache' : ''} of ${files.length} file(s)`,
    );

    reporter.onCliStart?.(cliConfig);

    for (const file of files) {
        const parsedFilePath = path.parse(file.path);

        reporter.onFileStart?.(parsedFilePath, file.config);

        // Get cached data if cache is enabled
        const cachedData = cacheEnabled ? cache.getCacheData(file.path, file.config) : undefined;

        // eslint-disable-next-line no-await-in-loop
        const { results } = await runLinterWorker({
            tasks: [
                {
                    filePath: file.path,
                    cwd,
                    linterConfig: file.config,
                    mtime: file.mtime,
                    size: file.size,
                    fileCacheData: cachedData,
                },
            ],
            cliConfig,
        });

        const result = results[0]!;

        // Update cache if enabled
        if (cacheEnabled) {
            if (result.fromCache) {
                cacheHits += 1;
            } else {
                cacheMisses += 1;
            }

            // Store result in cache with content hash if available
            if (!result.fromCache || result.fileHash) {
                cache.setCachedResult(
                    file.path,
                    file.mtime,
                    file.size,
                    file.config,
                    result.linterResult,
                    result.fileHash,
                );
            }
        }

        if (!foundErrors && hasErrors(result.linterResult)) {
            foundErrors = true;
        }

        reporter.onFileEnd?.(parsedFilePath, result.linterResult, result.fromCache);
    }

    reporter.onCliEnd?.();

    if (cacheEnabled) {
        const hitRate = files.length > 0 ? ((cacheHits / files.length) * 100).toFixed(1) : '0.0';
        executorDebug.log(
            `Sequential processing completed: ${cacheHits} cache hits, ${cacheMisses} misses (${hitRate}% hit rate)`,
        );
    }

    return foundErrors;
}

/**
 * Runs linting in parallel using worker threads.
 *
 * Distributes file buckets across worker threads for concurrent processing.
 * Each bucket is processed by a separate worker, improving performance for
 * large projects. If cache is enabled, checks cache before linting and updates it with results.
 *
 * @param buckets File buckets distributed for parallel processing.
 * @param cliConfig CLI configuration options.
 * @param reporter Reporter for outputting results.
 * @param cwd Current working directory.
 * @param maxThreads Maximum number of worker threads to use.
 * @param cache Optional cache instance for storing and retrieving results.
 *
 * @returns True if any file has errors, false otherwise.
 */
export async function runParallel(
    buckets: ScannedFile[][],
    cliConfig: LinterCliConfig,
    reporter: LinterCliReporter,
    cwd: string,
    maxThreads: number,
    cache?: LintResultCache,
): Promise<boolean> {
    const debug = new Debug({
        enabled: cliConfig.debug || false,
        colors: cliConfig.color ?? true,
        colorFormatter: chalkColorFormatter,
    });
    const executorDebug = debug.module('executor');

    let foundErrors = false;
    let cacheHits = 0;
    let cacheMisses = 0;

    const cacheEnabled = cache && cliConfig.cache;
    const totalFiles = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
    executorDebug.log(
        `Starting parallel processing${cacheEnabled ? ' with cache' : ''} of ${totalFiles} file(s) `
        + `in ${buckets.length} bucket(s) with ${maxThreads} thread(s)`,
    );

    const piscina = new Piscina({
        filename: path.resolve(__dirname, './worker.js'),
        idleTimeout: 30_000,
        minThreads: Math.min(1, maxThreads),
        maxThreads,
    });

    reporter.onCliStart?.(cliConfig);

    await Promise.all(
        buckets.map(async (bucket) => {
            if (bucket.length === 0) {
                return;
            }

            for (const f of bucket) {
                reporter.onFileStart?.(path.parse(f.path), f.config);
            }

            const result = await piscina.run({
                tasks: bucket.map((f) => {
                    // Get cached data if cache is enabled
                    const cachedData = cacheEnabled ? cache.getCacheData(f.path, f.config) : undefined;

                    return {
                        filePath: f.path,
                        cwd,
                        linterConfig: f.config,
                        mtime: f.mtime,
                        size: f.size,
                        fileCacheData: cachedData,
                    };
                }),
                cliConfig,
            }) as LinterWorkerResults;

            for (let i = 0; i < bucket.length; i += 1) {
                const workerResult = result.results[i]!;

                // Update cache if enabled
                if (cacheEnabled) {
                    if (workerResult.fromCache) {
                        cacheHits += 1;
                    } else {
                        cacheMisses += 1;
                    }

                    // Store result in cache with content hash if available
                    if (!workerResult.fromCache || workerResult.fileHash) {
                        cache.setCachedResult(
                            bucket[i]!.path,
                            bucket[i]!.mtime,
                            bucket[i]!.size,
                            bucket[i]!.config,
                            workerResult.linterResult,
                            workerResult.fileHash,
                        );
                    }
                }

                reporter.onFileEnd?.(path.parse(bucket[i]!.path), workerResult.linterResult, workerResult.fromCache);

                if (!foundErrors && hasErrors(workerResult.linterResult)) {
                    foundErrors = true;
                }
            }
        }),
    );

    reporter.onCliEnd?.();

    if (cacheEnabled) {
        const hitRate = totalFiles > 0 ? ((cacheHits / totalFiles) * 100).toFixed(1) : '0.0';
        executorDebug.log(
            `Parallel processing completed: ${cacheHits} cache hits, ${cacheMisses} misses (${hitRate}% hit rate)`,
        );
    } else {
        executorDebug.log('Parallel processing completed');
    }

    return foundErrors;
}
