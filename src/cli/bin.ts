#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable n/no-process-exit */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';

import { version } from '../../package.json';
import { Debug } from '../utils/debug';
import { getFormattedError } from '../utils/error';

import { LintResultCache } from './cache';
import { buildCliProgram, enforceSoloOptions, type LinterCliConfig } from './cli-options';
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
import { LinterJsonReporter } from './reporters/json';
import { type LinterCliReporter } from './reporters/reporter';
import { ConfigResolver } from './utils/config-resolver';
import { chalkColorFormatter } from './utils/debug-colors';
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
    let options: LinterCliConfig | undefined;

    try {
        const cwd = process.cwd();
        const program = buildCliProgram();

        program.parse(process.argv);

        options = program.opts() as LinterCliConfig;

        // Auto-detect TTY for color output if not explicitly set
        // Default to true if stdout is a TTY (terminal), false otherwise (e.g., piped output)
        const useColors = options.color ?? (process.stdout.isTTY ?? false);

        // Initialize debug logger
        const debug = new Debug({
            enabled: options.debug || false,
            colors: useColors,
            colorFormatter: chalkColorFormatter,
        });
        const cliDebug = debug.module('cli');

        if (options.debug) {
            cliDebug.log('Debug mode enabled');
        }

        enforceSoloOptions(program, ['init']);

        // Handle --init option early (mutually exclusive with all other options)
        if (options.init) {
            const initWizard = new LinterCliInitWizard(cwd);
            await initWizard.run();
            return;
        }

        const fsAdapter = new NodeFileSystemAdapter();
        const pathAdapter = new NodePathAdapter();

        cliDebug.log('Initializing config resolver');
        const configResolver = new ConfigResolver(
            fsAdapter,
            pathAdapter,
            {
                presetsRoot: pathAdapter.join(__dirname, '../../config-presets'),
                baseConfig: {},
            },
            debug.module('config-resolver'),
        );

        cliDebug.log('Building linter tree');
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
            debug.module('linter-tree'),
        );

        if (options.debug) {
            cliDebug.log(`Matching patterns: ${program.args.length > 0 ? program.args.join(', ') : DEFAULT_PATTERN}`);
        }
        const matchedPatterns = await matchPatterns(
            program.args.length > 0 ? program.args : [DEFAULT_PATTERN],
            fsAdapter,
            pathAdapter,
            {
                cwd,
                defaultIgnorePatterns: [...DEFAULT_IGNORE_PATTERNS],
                followSymlinks: false,
                dot: true,
                debug: debug.module('pattern-matcher'),
            },
        );

        // Pre-populate tree structure. Must be sequential to avoid race conditions
        // where multiple files in the same directory scan config/ignore files concurrently.
        for (const pattern of matchedPatterns.files) {
            // eslint-disable-next-line no-await-in-loop
            await tree.addFile(pattern);
        }

        cliDebug.log('Initializing file scanner');
        const scanner = new LinterFileScanner(
            tree,
            configResolver,
            fsAdapter,
            debug.module('file-scanner'),
        );

        cliDebug.log('Scanning files');
        const files = await scanner.scanAll(matchedPatterns.files);

        if (options.printConfig) {
            if (matchedPatterns.files.length !== 1) {
                throw new Error('Please specify a pattern that matches exactly one file.');
            }

            const file = matchedPatterns.files[0]!;
            const config = await tree.getResolvedConfig(file);

            console.log(inspect(config, {
                colors: useColors,
                depth: Infinity,
            }));
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

        if (cache) {
            cliDebug.log(`Cache enabled: ${options.cacheLocation}`);
            cliDebug.log(`Cache strategy: ${options.cacheStrategy}`);
        } else {
            cliDebug.log('Cache disabled');
        }

        let reporter: LinterCliReporter;
        if (options.reporter === 'json' || options.reporter === 'json-with-metadata') {
            reporter = new LinterJsonReporter();
        } else {
            reporter = new LinterConsoleReporter(useColors);
        }

        cliDebug.log(`Reporter initialized: ${options.reporter}`);

        // Calculate thread configuration
        const threadsOpt = options.threads as ThreadsOption;
        const { maxThreads, isAutoMode } = calculateThreads(threadsOpt);

        // Create file tasks and calculate total size
        const totalSize = getTotalSize(files);
        const isSmall = isSmallProject(files.length, totalSize);

        cliDebug.log(`Thread configuration: ${maxThreads} max threads (auto: ${isAutoMode})`);
        cliDebug.log(`Project size: ${files.length} files, ${totalSize} bytes (small: ${isSmall})`);

        let hasErrors = false;

        // Run sequentially if single-threaded or auto mode with small project
        if (maxThreads === 1 || (isAutoMode && isSmall)) {
            cliDebug.log('Running in sequential mode');
            if (cache) {
                hasErrors = await runSequentialWithCache(files, options, reporter, cwd, cache);
            } else {
                hasErrors = await runSequential(files, options, reporter, cwd);
            }
        } else {
            cliDebug.log(`Running in parallel mode with ${maxThreads} threads`);
            // Run in parallel with bucketed tasks
            const buckets = createFileTaskBuckets(files, maxThreads);
            if (options.debug) {
                const bucketSizes = buckets.map((b) => b.length);
                const avgBucketSize = (files.length / buckets.length).toFixed(1);
                cliDebug.log(
                    `Created ${buckets.length} bucket(s): `
                    + `[${bucketSizes.join(', ')}] (avg: ${avgBucketSize} files/bucket)`,
                );
            }
            if (cache) {
                hasErrors = await runParallelWithCache(buckets, options, reporter, cwd, maxThreads, cache);
            } else {
                hasErrors = await runParallel(buckets, options, reporter, cwd, maxThreads);
            }
        }

        // Save cache after execution
        if (cache) {
            cliDebug.log('Saving cache');
            await cache.save();
        }

        cliDebug.log(`Linting completed. Errors: ${hasErrors}`);

        if (hasErrors) {
            cliDebug.log('Exiting with error code 1');
            process.exit(1);
        }

        cliDebug.log('Exiting successfully');
    } catch (error: unknown) {
        const prefix = [
            'Oops! Something went wrong! :(',
            '',
            `AGLint: ${version}`,
            '',
            '',
        ].join('\n');

        // Use color option if available, otherwise auto-detect TTY
        const useColors = options?.color ?? (process.stderr.isTTY ?? false);
        console.error(prefix + await getFormattedError(error, { colors: useColors }));

        process.exit(2);
    }
};

main();
