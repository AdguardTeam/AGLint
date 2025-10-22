#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable n/no-process-exit */
import { version } from '../../package.json';
import { getFormattedError } from '../utils/error';

import { LintResultCache } from './cache';
import { buildCliProgram, type LinterCliConfig } from './cli-options';
import {
    runParallel,
    runParallelWithCache,
    runSequential,
    runSequentialWithCache,
} from './executor';
import { IGNORE_FILE_NAME, scan } from './file-scanner';
import { LinterCliInitWizard } from './init-wizard';
import { LinterConsoleReporter } from './reporters/console';
import { createFileTaskBuckets, getTotalSize } from './task-scheduler';
import { calculateThreads, isSmallProject, type ThreadsOption } from './thread-manager';

const main = async () => {
    try {
        const cwd = process.cwd();
        const program = buildCliProgram();

        program.parse(process.argv);

        const options = program.opts() as LinterCliConfig;

        // Handle --init option early (mutually exclusive with all other options)
        if (options.init) {
            const initWizard = new LinterCliInitWizard(cwd);
            await initWizard.run();
            return;
        }

        const cache = options.cache
            ? await LintResultCache.create(cwd, options.cacheLocation)
            : undefined;

        const files = await scan({
            patterns: program.args,
            cwd,
            ignoreFileName: IGNORE_FILE_NAME,
            ignorePatterns: options.ignorePatterns,
            followSymlinks: false,
        });

        const reporter = new LinterConsoleReporter(options.color);

        // Calculate thread configuration
        const threadsOpt = options.threads as ThreadsOption;
        const { maxThreads, isAutoMode } = calculateThreads(threadsOpt);

        // Create file tasks and calculate total size
        const totalSize = getTotalSize(files.files);
        const isSmall = isSmallProject(files.files.length, totalSize);

        let hasErrors = false;

        // Run sequentially if single-threaded or auto mode with small project
        if (maxThreads === 1 || (isAutoMode && isSmall)) {
            if (cache) {
                hasErrors = await runSequentialWithCache(files.files, options, reporter, cwd, cache);
            } else {
                hasErrors = await runSequential(files.files, options, reporter, cwd);
            }
        } else {
            // Run in parallel with bucketed tasks
            const buckets = createFileTaskBuckets(files.files, maxThreads);
            if (cache) {
                hasErrors = await runParallelWithCache(buckets, options, reporter, cwd, maxThreads, cache);
            } else {
                hasErrors = await runParallel(buckets, options, reporter, cwd, maxThreads);
            }
        }

        // Save cache after execution
        if (cache) {
            await cache.save();
        }

        if (hasErrors) {
            process.exit(1);
        }
    } catch (error: unknown) {
        const prefix = [
            'Oops! Something went wrong! :(',
            '',
            `AGLint: ${version}`,
            '',
            '',
        ].join('\n');

        console.error(prefix + getFormattedError(error));

        process.exit(1);
    }
};

main();
