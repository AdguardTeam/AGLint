#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable n/no-process-exit */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { version } from '../../package.json';
import { getFormattedError } from '../utils/error';

import { LintResultCache } from './cache';
import { buildCliProgram, type LinterCliConfig } from './cli-options';
import { CONFIG_FILE_NAMES } from './config-file/config-file';
import { DEFAULT_PATTERN, IGNORE_FILE_NAME } from './constants';
import {
    runParallel,
    runParallelWithCache,
    runSequential,
    runSequentialWithCache,
} from './executor';
import { LinterCliInitWizard } from './init-wizard';
import { LinterConsoleReporter } from './reporters/console';
import { ConfigResolver } from './utils/config-resolver';
import { LinterFileScanner } from './utils/file-scanner';
import { NodeFileSystemAdapter } from './utils/fs-adapter';
import { NodePathAdapter } from './utils/path-adapter';
import { DEFAULT_IGNORE_PATTERNS, matchPatterns } from './utils/pattern-matcher';
import { createFileTaskBuckets, getTotalSize } from './utils/task-scheduler';
import { calculateThreads, isSmallProject, type ThreadsOption } from './utils/thread-manager';
import { LinterTree } from './utils/tree-builder';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Main CLI entry point.
 *
 * Orchestrates the complete linting workflow:
 * 1. Parses CLI arguments and options
 * 2. Builds the project file tree with configurations
 * 3. Matches files based on patterns and ignore rules
 * 4. Handles special commands (--init)
 * 5. Sets up caching if enabled
 * 6. Determines execution strategy (sequential vs parallel)
 * 7. Runs linting with the chosen strategy
 * 8. Reports results and exits with appropriate code.
 */
const main = async () => {
    try {
        const cwd = process.cwd();
        const program = buildCliProgram();

        program.parse(process.argv);

        const options = program.opts() as LinterCliConfig;

        const fsAdapter = new NodeFileSystemAdapter();
        const pathAdapter = new NodePathAdapter();

        const configResolver = new ConfigResolver(fsAdapter, pathAdapter, {
            presetsRoot: pathAdapter.join(__dirname, '../../config-presets'),
            baseConfig: {},
        });

        const tree = new LinterTree(
            fsAdapter,
            pathAdapter,
            {
                root: cwd,
                configFileNames: CONFIG_FILE_NAMES,
                ignoreFileName: IGNORE_FILE_NAME,
            },
            {
                resolve: (p) => configResolver.resolve(p),
                isRoot: (p) => configResolver.isRoot(p),
            },
        );

        const matchedPatterns = await matchPatterns(
            program.args.length > 0 ? program.args : [DEFAULT_PATTERN],
            fsAdapter,
            pathAdapter,
            {
                cwd,
                defaultIgnorePatterns: [...DEFAULT_IGNORE_PATTERNS],
                followSymlinks: false,
                dot: true,
            },
        );

        for (const pattern of matchedPatterns.files) {
            tree.addFile(pattern);
        }

        const scanner = new LinterFileScanner(tree, configResolver, fsAdapter);

        const files = await scanner.scanAll(matchedPatterns.files);

        // Handle --init option early (mutually exclusive with all other options)
        if (options.init) {
            const initWizard = new LinterCliInitWizard(cwd);
            await initWizard.run();
            return;
        }

        // Check if at least one config file was found
        const noConfigFiles = files.find((file) => file.configChain.length === 0);
        if (noConfigFiles) {
            throw new Error(
                `No AGLint configuration found for file "${noConfigFiles.path}". `
                + 'Please create a configuration file using "aglint --init" '
                + 'or ensure a config file exists in your project.',
            );
        }

        const cache = options.cache
            ? await LintResultCache.create(cwd, options.cacheLocation)
            : undefined;

        const reporter = new LinterConsoleReporter(options.color);

        // Calculate thread configuration
        const threadsOpt = options.threads as ThreadsOption;
        const { maxThreads, isAutoMode } = calculateThreads(threadsOpt);

        // Create file tasks and calculate total size
        const totalSize = getTotalSize(files);
        const isSmall = isSmallProject(files.length, totalSize);

        let hasErrors = false;

        // Run sequentially if single-threaded or auto mode with small project
        if (maxThreads === 1 || (isAutoMode && isSmall)) {
            if (cache) {
                hasErrors = await runSequentialWithCache(files, options, reporter, cwd, cache);
            } else {
                hasErrors = await runSequential(files, options, reporter, cwd);
            }
        } else {
            // Run in parallel with bucketed tasks
            const buckets = createFileTaskBuckets(files, maxThreads);
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
