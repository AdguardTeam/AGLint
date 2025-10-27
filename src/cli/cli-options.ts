import { Command, Option } from 'commander';
import * as v from 'valibot';

import { version } from '../../package.json';
import type { LinterRuleType } from '../linter/rule';

import { CACHE_FILE_NAME, LinterCacheStrategy } from './cache';
import { DEFAULT_PATTERN, IGNORE_FILE_NAME, SUPPORTED_FILE_EXTENSIONS } from './constants';
import { threadOptionSchema, type ThreadsOption } from './utils/thread-manager';

/**
 * Complete configuration for the AGLint CLI.
 *
 * Includes options for file extensions, ignoring patterns, autofixing,
 * output formatting, caching, and performance tuning.
 */
export type LinterCliConfig = {
    /**
     * Additional file extensions to lint beyond the defaults.
     */
    ext: string[];

    /**
     * Whether to respect ignore files.
     */
    ignores: boolean;

    /**
     * Glob patterns for files to ignore.
     */
    ignorePatterns: string[];

    /**
     * Whether to apply automatic fixes.
     */
    fix: boolean;

    /**
     * Maximum number of fix rounds to apply.
     */
    maxFixRounds: number;

    /**
     * Limit fixes to specific problem types.
     */
    fixTypes?: LinterRuleType[];

    /**
     * Limit fixes to specific rules.
     */
    fixRules?: string[];

    /**
     * Whether to enable colored output.
     */
    color: boolean;

    /**
     * Whether to allow inline configuration comments.
     */
    inlineConfig: boolean;

    /**
     * Whether to enable result caching.
     */
    cache: boolean;

    /**
     * Path to the cache file or directory.
     */
    cacheLocation: string;

    /**
     * Strategy for cache invalidation.
     */
    cacheStrategy: LinterCacheStrategy;

    /**
     * Whether to run the initialization wizard.
     */
    init: boolean;

    /**
     * Thread configuration for parallel processing.
     */
    threads: ThreadsOption;
};

/**
 * Builds and configures the Commander program with all CLI options.
 *
 * Sets up argument parsing for file patterns and all CLI flags including
 * linting options, autofixing, caching, and performance tuning.
 *
 * @returns Configured Commander program instance ready to parse arguments.
 */
export function buildCliProgram(): Command {
    const program = new Command();

    program
        .name('aglint')
        .description('Linter for adblock filter lists')
        .usage('[options] [file|dir|glob]*')
        .summary('Linter for adblock filter lists.')

        .optionsGroup('Basic')
        .option(
            '--ext <ext...>',
            `Additional extensions to lint, ${Array.from(SUPPORTED_FILE_EXTENSIONS).join(', ')} are linted always`,
            [],
        )

        .optionsGroup('Ignore Files')
        .option('--no-ignores', `Force ignoring ${IGNORE_FILE_NAME} files`, false)
        .option('--ignore-patterns <pattern...>', 'Ignore files matching the specified glob patterns', [])

        .optionsGroup('Autofixing')
        .addOption(
            new Option(
                '-f, --fix',
                'Apply fixes if possible by overwriting original files',
            ).default(false),
        )
        .addOption(
            new Option(
                '--max-fix-rounds <number>',
                'Maximum number of fix rounds to apply',
            ).default(10),
        )
        .addOption(
            new Option(
                '--fix-types <type...>',
                'Apply fixes only for the specified problem types',
            ),
        )
        .addOption(
            new Option(
                '--fix-rules <rule...>',
                'Apply fixes only for the specified rules',
            ),
        )

        .optionsGroup('Output')
        .option('--color', 'Force enable color output')
        .option('--no-color', 'Force disable color output')

        .optionsGroup('Inline configuration comments')
        .option('--no-inline-config', 'Disable inline configuration comments')

        .optionsGroup('Caching')
        .option('--cache', 'Enable caching', false)
        .option('--cache-location <path>', 'Path to the cache directory or file', CACHE_FILE_NAME)
        .addOption(
            new Option(
                '--cache-strategy <strategy>',
                'Cache strategy',
            ).choices(Object.values(LinterCacheStrategy)).default(LinterCacheStrategy.Metadata),
        )

        .optionsGroup('Miscellaneous')
        .addOption(
            new Option('--init', 'Initialize config file in the current directory'),
        )
        .addOption(
            new Option('--threads <value>', 'Number of threads to use: "off" | "auto" | <number>')
                .default('off')
                .argParser((rawValue: string) => {
                    return v.parse(threadOptionSchema, rawValue);
                }),
        )
        .version(version, '-v, --version', 'Output the version number')
        .helpOption('-h, --help', 'Display help for command')

        .argument(
            '[patterns...]',
            'Patterns to lint, they could be files, directories or glob patterns',
            DEFAULT_PATTERN,
        );

    return program;
}
