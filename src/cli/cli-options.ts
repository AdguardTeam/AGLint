import { Command, Option } from 'commander';
import * as v from 'valibot';

import { version } from '../../package.json';
import type { LinterRuleType } from '../linter/rule';

import { CACHE_FILE_NAME, LinterCacheStrategy } from './cache';
import { DEFAULT_PATTERN, IGNORE_FILE_NAME, SUPPORTED_FILE_EXTENSIONS } from './constants';
import { threadOptionSchema, type ThreadsOption } from './utils/thread-manager';

export type LinterCliConfig = {
    ext: string[];

    ignores: boolean;
    ignorePatterns: string[];

    fix: boolean;
    maxFixRounds: number;
    fixTypes?: LinterRuleType[];
    fixRules?: string[];

    color: boolean;

    inlineConfig: boolean;

    cache: boolean;
    cacheLocation: string;
    cacheStrategy: LinterCacheStrategy;

    init: boolean;
    threads: ThreadsOption;
};

/**
 * Builds and configures the Commander program with all CLI options
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
