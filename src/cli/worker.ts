import * as v from 'valibot';

import { type LinterConfig, linterConfigSchema } from '../linter/config';
import { defaultSubParsers } from '../linter/default-subparsers';
import { type AnyLinterResult, applyFixesToResult, lintWithFixes } from '../linter/fixer';
import { lint, type LinterRunOptions } from '../linter/linter';
import { type LinterRule } from '../linter/rule';
import { Debug } from '../utils/debug';

import { type CacheFileData, getFileHash, LinterCacheStrategy } from './cache';
import { type LinterCliConfig } from './cli-options';
import { chalkColorFormatter } from './utils/debug-colors';

const fsPromises = import('node:fs/promises');
const { readFile, writeFile } = await fsPromises;

/**
 * Represents a single file linting task for a worker thread.
 */
export type LinterWorkerTask = {
    /**
     * Absolute path to the file to lint.
     */
    filePath: string;

    /**
     * Current working directory.
     */
    cwd: string;

    /**
     * Linter configuration for this file.
     */
    linterConfig: LinterConfig;

    /**
     * Optional cached data if cache is enabled.
     */
    fileCacheData?: CacheFileData;
};

/**
 * Collection of tasks and configuration for a worker thread.
 */
export type LinterWorkerTasks = {
    /**
     * Array of file tasks to process.
     */
    tasks: LinterWorkerTask[];

    /**
     * CLI configuration options.
     */
    cliConfig: LinterCliConfig;
};

/**
 * Result of linting a single file in a worker thread.
 */
export type LinterWorkerResult = {
    /**
     * The linting result (with or without fixes).
     */
    linterResult: AnyLinterResult;

    /**
     * Whether the result was retrieved from cache.
     */
    fromCache: boolean;

    /**
     * Content hash if computed (for content-based caching).
     */
    fileHash?: string;
};

/**
 * Collection of results from processing multiple files in a worker thread.
 */
export type LinterWorkerResults = {
    /**
     * Array of results corresponding to the input tasks.
     */
    results: LinterWorkerResult[];
};

/**
 * Cache for loaded rule modules to avoid repeated imports.
 */
const ruleCache = new Map<string, LinterRule>();

/**
 * Worker function that processes linting tasks.
 *
 * Handles:
 * - Cache validation and usage
 * - File reading and hashing
 * - Linting with or without fixes
 * - Writing fixed files back to disk.
 *
 * This function runs in worker threads for parallel processing.
 *
 * @param tasks Collection of files to lint and configuration.
 *
 * @returns Results for all processed files.
 */
const runLinterWorker = async (tasks: LinterWorkerTasks): Promise<LinterWorkerResults> => {
    // Create debug logger for worker thread
    const debug = new Debug({
        enabled: tasks.cliConfig.debug ?? false,
        colors: tasks.cliConfig.color ?? true,
        colorFormatter: chalkColorFormatter,
    });
    const workerDebug = debug.module('worker');

    if (tasks.cliConfig.debug) {
        workerDebug.log(`Processing ${tasks.tasks.length} task(s) in worker thread`);
    }

    const promises = tasks.tasks.map(async (task): Promise<LinterWorkerResult> => {
        // Check if we have valid cached data
        if (tasks.cliConfig.cache && task.fileCacheData) {
            const strategy = tasks.cliConfig.cacheStrategy!;
            let cacheValid = false;
            let fileHash: string | undefined;

            if (strategy === LinterCacheStrategy.Metadata) {
                // For metadata strategy, executor already validated mtime/size
                cacheValid = true;
            } else if (strategy === LinterCacheStrategy.Content) {
                // For content strategy, read file and check hash
                const content = await readFile(task.filePath, 'utf8');
                fileHash = getFileHash(content);
                cacheValid = task.fileCacheData.contentHash === fileHash;

                // If cache valid and fix mode, apply fixes from cached result
                if (cacheValid && tasks.cliConfig.fix) {
                    const fixedSource = applyFixesToResult({
                        linterResult: task.fileCacheData.linterResult,
                        sourceContent: content,
                        maxFixRounds: tasks.cliConfig.maxFixRounds,
                        categories: tasks.cliConfig.fixTypes ? new Set(tasks.cliConfig.fixTypes) : undefined,
                        ruleIds: tasks.cliConfig.fixRules ? new Set(tasks.cliConfig.fixRules) : undefined,
                    });

                    if (fixedSource !== content) {
                        await writeFile(task.filePath, fixedSource);
                    }
                }
            }

            if (cacheValid) {
                return {
                    linterResult: task.fileCacheData.linterResult,
                    fromCache: true,
                    fileHash,
                };
            }
        }

        // Cache miss or no cache - read file and lint
        const content = await readFile(task.filePath, 'utf8');
        let fileHash: string | undefined;

        // Compute hash for content strategy
        if (tasks.cliConfig.cache && tasks.cliConfig.cacheStrategy === LinterCacheStrategy.Content) {
            fileHash = getFileHash(content);
        }

        v.assert(linterConfigSchema, task.linterConfig);

        // Create debug object for linter if debug mode is enabled
        const debugFn = tasks.cliConfig.debug
            ? debug.module('linter')
            : undefined;

        const commonLinterRunOptions: LinterRunOptions = {
            fileProps: {
                filePath: task.filePath,
                content,
                cwd: task.cwd,
            },
            config: {
                ...task.linterConfig,
                reportUnusedDisableDirectives: tasks.cliConfig.reportUnusedDisableDirectives,
                unusedDisableDirectivesSeverity: tasks.cliConfig.unusedDisableDirectivesSeverity,
            },
            loadRule: async (ruleName) => {
                if (ruleCache.has(ruleName)) {
                    return ruleCache.get(ruleName);
                }

                const rule = (await import(`../rules/${ruleName}.js`)).default;
                ruleCache.set(ruleName, rule);

                return rule;
            },
            subParsers: defaultSubParsers,
            debug: debugFn,
            // Include metadata for console reporter (for docs URLs)
            // and json-with-metadata reporter
            includeMetadata: tasks.cliConfig.reporter === 'console'
                || tasks.cliConfig.reporter === 'json-with-metadata',
        };

        if (tasks.cliConfig.fix) {
            const linterResult = await lintWithFixes({
                ...commonLinterRunOptions,
                maxFixRounds: tasks.cliConfig.maxFixRounds,
                categories: tasks.cliConfig.fixTypes ? new Set(tasks.cliConfig.fixTypes) : undefined,
                ruleIds: tasks.cliConfig.fixRules ? new Set(tasks.cliConfig.fixRules) : undefined,
            });

            if (linterResult.fixedSource !== content) {
                await writeFile(task.filePath, linterResult.fixedSource);
            }

            return {
                linterResult,
                fromCache: false,
                fileHash,
            };
        }

        return {
            linterResult: await lint(commonLinterRunOptions),
            fromCache: false,
            fileHash,
        };
    });

    const results = await Promise.all(promises);

    if (tasks.cliConfig.debug) {
        workerDebug.log(`Completed ${tasks.tasks.length} task(s) in worker thread`);
    }

    return { results };
};

export default runLinterWorker;
