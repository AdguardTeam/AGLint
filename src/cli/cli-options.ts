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
     * Whether to report unused disable directives.
     */
    reportUnusedDisableDirectives: boolean;

    /**
     * Severity of unused disable directives.
     */
    unusedDisableDirectivesSeverity: 'warn' | 'error';

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

    /**
     * Whether to print configuration.
     */
    printConfig: boolean;

    /**
     * Whether to enable debug logging.
     */
    debug: boolean;
};

/**
 * Enforces that only one of the given options is enabled.
 * This function is needed because commander.js only provides a .conflicts() method,
 * but that method requires specifying the names of all other conflicting options
 * if you want to specify a solo option.
 *
 * @param program The Commander program instance.
 * @param soloLongFlags Array of option names to enforce.
 */
export const enforceSoloOptions = (program: Command, soloLongFlags: string[] = []) => {
    const enabledFromCli = program.options.filter((opt) => {
        const source = program.getOptionValueSource(opt.name());
        return source === 'cli';
    });

    for (const solo of soloLongFlags) {
        if (program.getOptionValueSource(solo) === 'cli' && enabledFromCli.length > 1) {
            throw new Error(`The --${solo} option cannot be used with other options.`);
        }
    }
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
        .option('--report-unused-disable-directives', 'Report unused disable directives')
        .addOption(
            new Option(
                '--unused-disable-directives-severity <severity>',
                'Severity of unused disable directives',
            ).choices(['warn', 'error']).default('warn'),
        )

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
        .addOption(
            new Option('--print-config', 'Print configuration for the given file without linting'),
        )
        .addOption(
            new Option('--debug', 'Enable debug logging with colored module output'),
        )
        .version(version, '-v, --version', 'Output the version number')
        .helpOption('-h, --help', 'Display help for command')

        .argument(
            '[patterns...]',
            'Patterns to lint, they could be files, directories or glob patterns',
            DEFAULT_PATTERN,
        )

        .addHelpText('after', [
            '',
            'Examples:',
            '  $ aglint',
            '  $ aglint path/to/file.txt',
            '  $ aglint path/to/directory',
            "  $ aglint '**/*.filter'",
            '  $ aglint path/to/file.txt path/to/directory "**/*.filter"',
            '  $ aglint path/to/file.txt --fix',
            '',
            "Please add quotes to glob patterns like `aglint '**/*.txt'`, otherwise your shell may expand them.",
            '',
            'If you do not specify any patterns, aglint will use its default patterns, so',
            '  $ aglint',
            'is equivalent to',
            `  $ aglint '${DEFAULT_PATTERN}'`,
            '',
        ].join('\n'));

    return program;
}
