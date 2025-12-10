/**
 * Main CLI execution logic.
 *
 * This module contains the core CLI logic extracted from bin.ts to make it testable.
 * The separation allows for:
 * - Unit/E2E testing without dealing with process.exit()
 * - Mocking process.argv, process.cwd(), etc.
 * - Testing error handling and edge cases
 * - Avoiding immediate execution on import.
 *
 * The bin.ts file remains minimal as just the entry point that calls this function.
 */

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
import { runParallel, runSequential } from './executor';
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
 * CLI execution context for dependency injection.
 */
export interface CliContext {
    /**
     * Command line arguments.
     */
    argv: string[];

    /**
     * Current working directory.
     */
    cwd: string;

    /**
     * Standard output stream.
     */
    stdout: NodeJS.WriteStream;

    /**
     * Standard error stream.
     */
    stderr: NodeJS.WriteStream;
}

/**
 * Result of CLI execution.
 */
export interface CliResult {
    /**
     * Exit code (0 = success, 1 = lint errors, 2 = fatal error).
     */
    exitCode: number;

    /**
     * Error message if execution failed.
     */
    error?: string;
}

/**
 * Main CLI execution function.
 *
 * Orchestrates the complete linting workflow:
 * 1. Parses CLI arguments and options
 * 2. Builds the project file tree with configurations
 * 3. Matches files based on patterns and ignore rules
 * 4. Handles special commands (--init, --print-config)
 * 5. Sets up caching if enabled
 * 6. Determines execution strategy (sequential vs parallel)
 * 7. Runs linting with the chosen strategy
 * 8. Reports results and returns exit code.
 *
 * @param context CLI execution context (defaults to process globals).
 *
 * @returns Promise resolving to exit code and optional error message.
 */
export async function runCli(context?: Partial<CliContext>): Promise<CliResult> {
    const ctx: CliContext = {
        argv: context?.argv ?? process.argv,
        cwd: context?.cwd ?? process.cwd(),
        stdout: context?.stdout ?? process.stdout,
        stderr: context?.stderr ?? process.stderr,
    };

    let options: LinterCliConfig | undefined;

    try {
        const program = buildCliProgram();

        program.parse(ctx.argv);

        options = program.opts() as LinterCliConfig;

        // Auto-detect TTY for color output if not explicitly set
        // Default to true if stdout is a TTY (terminal), false otherwise (e.g., piped output)
        const useColors = options.color ?? (ctx.stdout.isTTY ?? false);

        // Initialize debug logger
        const debug = new Debug({
            enabled: options.debug || false,
            colors: useColors,
            colorFormatter: chalkColorFormatter,
        });
        const cliDebug = debug.module('cli');

        const patterns = program.args.length > 0 ? program.args : [DEFAULT_PATTERN];

        if (options.debug) {
            const inspectOpts = {
                colors: useColors,
                depth: Infinity,
                compact: true,
                breakLength: Infinity,
            };
            cliDebug.log(`CLI args: ${inspect(ctx.argv.slice(2), inspectOpts)}`);
            cliDebug.log(`CLI options: ${inspect(options, inspectOpts)}`);
            cliDebug.log(`Patterns: ${inspect(patterns, inspectOpts)}`);
        }

        enforceSoloOptions(program, ['init']);

        // Handle --init option early (mutually exclusive with all other options)
        if (options.init) {
            const initWizard = new LinterCliInitWizard(ctx.cwd);
            await initWizard.run();
            return { exitCode: 0 };
        }

        const fsAdapter = new NodeFileSystemAdapter();
        const pathAdapter = new NodePathAdapter();

        const configResolver = new ConfigResolver(
            fsAdapter,
            pathAdapter,
            {
                presetsRoot: pathAdapter.join(__dirname, '../../config-presets'),
                baseConfig: {},
            },
            debug.module('config-resolver'),
        );

        const tree = new LinterTree(
            fsAdapter,
            pathAdapter,
            {
                root: ctx.cwd,
                configFileNames: CONFIG_FILE_NAMES,
                ignoreFileName: IGNORE_FILE_NAME,
            },
            {
                resolve: (p) => configResolver.resolve(p),
                isRoot: (p) => configResolver.isRoot(p),
            },
            debug.module('linter-tree'),
        );

        const matchedPatterns = await matchPatterns(
            patterns,
            fsAdapter,
            pathAdapter,
            {
                cwd: ctx.cwd,
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

        const scanner = new LinterFileScanner(
            tree,
            configResolver,
            fsAdapter,
            debug.module('file-scanner'),
        );

        const files = await scanner.scanAll(matchedPatterns.files);

        if (options.printConfig) {
            if (matchedPatterns.files.length !== 1) {
                throw new Error('Please specify a pattern that matches exactly one file.');
            }

            const file = matchedPatterns.files[0]!;
            const config = await tree.getResolvedConfig(file);

            console.log(
                inspect(config, {
                    colors: useColors,
                    depth: Infinity,
                }),
            );
            return { exitCode: 0 };
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
            ? await LintResultCache.create(ctx.cwd, options.cacheLocation)
            : undefined;

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

        let foundErrors = false;

        // Run sequentially if single-threaded or auto mode with small project
        if (maxThreads === 1 || (isAutoMode && isSmall)) {
            cliDebug.log('Running in sequential mode');
            foundErrors = await runSequential(files, options, reporter, ctx.cwd, cache);
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
            foundErrors = await runParallel(buckets, options, reporter, ctx.cwd, maxThreads, cache);
        }

        // Save cache after execution
        if (cache) {
            cliDebug.log('Saving cache');
            await cache.save();
        }

        cliDebug.log(`Linting completed. Errors: ${foundErrors}`);

        if (foundErrors) {
            cliDebug.log('Exiting with error code 1');
            return { exitCode: 1 };
        }

        cliDebug.log('Exiting successfully');
        return { exitCode: 0 };
    } catch (error: unknown) {
        const prefix = [
            'Oops! Something went wrong! :(',
            '',
            `AGLint: ${version}`,
            '',
            '',
        ].join('\n');

        // Use color option if available, otherwise auto-detect TTY
        const useColors = options?.color ?? (ctx.stderr.isTTY ?? false);
        const errorMessage = prefix + await getFormattedError(error, { colors: useColors });

        // eslint-disable-next-line no-console
        console.error(errorMessage);

        return { exitCode: 2, error: errorMessage };
    }
}
