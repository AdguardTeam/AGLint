import path, { type ParsedPath } from 'node:path';
import { readFile } from 'node:fs/promises';
import fs from 'fs-extra';
import cloneDeep from 'clone-deep';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import { LinterCli } from '../../../src/linter/cli';
import { type LinterCliReporter } from '../../../src/linter/cli/reporter';
import { type LinterResult } from '../../../src/linter';
import { StringUtils } from '../../../src/utils/string';

/**
 * Path to the `test/fixtures/cli` directory
 */
const FIXTURE_SOURCE = path.join('test/fixtures', 'cli');

/**
 * Path to the `test/fixtures/cli-temporary` directory
 */
const FIXTURE_PATH = path.join('test/fixtures', 'cli-temporary');

/**
 * A simple tuple type for logging events.
 */
type LoggedEvent = [string, unknown];

/**
 * Reporter for testing purposes.
 */
class TestReporter implements LinterCliReporter {
    private events: LoggedEvent[] = [];

    onLintStart = () => {
        this.events.push(['onLintStart', null]);
    };

    onFileStart = (file: ParsedPath) => {
        this.events.push(['onFileStart', file]);
    };

    onFileEnd = (file: ParsedPath, result: LinterResult) => {
        this.events.push(['onFileEnd', { file, result }]);
    };

    onLintEnd = () => {
        this.events.push(['onLintEnd', null]);
    };

    /**
     * Returns a copy of the logged events.
     *
     * @returns A copy of the logged events.
     */
    getLoggedEvents = () => {
        return cloneDeep(this.events);
    };
}

describe('CLI tests', () => {
    // We need to prepare a clean fixture before running the CLI tests
    beforeEach(async () => {
        if (await fs.pathExists(FIXTURE_PATH)) {
            await fs.remove(FIXTURE_PATH);
        }

        await fs.copy(FIXTURE_SOURCE, FIXTURE_PATH);
    });

    // After the CLI tests have run, we need to delete the temporary fixture
    afterEach(async () => {
        await fs.remove(FIXTURE_PATH);
    });

    test('works with default configuration', async () => {
        const reporter = new TestReporter();

        // Leave 2nd and 3rd argument empty to use default values
        const cli = new LinterCli(reporter);

        // Don't pass any arguments to use the default values
        await cli.run(FIXTURE_PATH);

        expect(reporter.getLoggedEvents()).toMatchObject([
            ['onLintStart', null],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'root_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'root_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 2,
                                message: 'Cannot parse CSS due to the following error: Name is expected',
                                position: {
                                    startLine: 2,
                                    startColumn: 14,
                                    endLine: 2,
                                    endColumn: 17,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 1,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 2,
                                    startColumn: 25,
                                    endLine: 2,
                                    endColumn: 55,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 1,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file2.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file2.txt')),
                    result: {
                        problems: [],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir2/dir2_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir2/dir2_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 2,
                                    startColumn: 25,
                                    endLine: 2,
                                    endColumn: 55,
                                },
                            },
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 6,
                                    startColumn: 25,
                                    endLine: 6,
                                    endColumn: 55,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 2,
                    },
                },
            ],
            [
                'onFileStart',
                path.parse(path.join(FIXTURE_PATH, 'fixable/fixable_file1.txt')),
            ],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'fixable/fixable_file1.txt')),
                    result: {
                        problems: [
                            {
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 2,
                                    endLine: 2,
                                    endColumn: 24,
                                },
                            },
                        ],
                        warningCount: 1,
                        errorCount: 0,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onLintEnd', null],
        ]);
    });

    test('works with disabled ignore files', async () => {
        const reporter = new TestReporter();

        // No fix, no ignore files
        const cli = new LinterCli(reporter, false, false);

        // Don't pass any arguments to use the default values
        await cli.run(FIXTURE_PATH);

        expect(reporter.getLoggedEvents()).toMatchObject([
            ['onLintStart', null],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'root_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'root_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 2,
                                message: 'Cannot parse CSS due to the following error: Name is expected',
                                position: {
                                    startLine: 2,
                                    startColumn: 14,
                                    endLine: 2,
                                    endColumn: 17,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 1,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'root_file2.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'root_file2.txt')),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 2,
                                    startColumn: 25,
                                    endLine: 2,
                                    endColumn: 55,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 1,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 2,
                                    startColumn: 25,
                                    endLine: 2,
                                    endColumn: 55,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 1,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file2.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file2.txt')),
                    result: {
                        problems: [],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir2/dir2_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir2/dir2_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 2,
                                    startColumn: 25,
                                    endLine: 2,
                                    endColumn: 55,
                                },
                            },
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 6,
                                    startColumn: 25,
                                    endLine: 6,
                                    endColumn: 55,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 2,
                    },
                },
            ],
            [
                'onFileStart',
                path.parse(path.join(FIXTURE_PATH, 'fixable/fixable_file1.txt')),
            ],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'fixable/fixable_file1.txt')),
                    result: {
                        problems: [
                            {
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 2,
                                    endLine: 2,
                                    endColumn: 24,
                                },
                            },
                        ],
                        warningCount: 1,
                        errorCount: 0,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onLintEnd', null],
        ]);
    });

    test('works with fix enabled', async () => {
        const reporter = new TestReporter();

        // Fix enabled, ignore files default (enabled)
        const cli = new LinterCli(reporter, true);

        // Don't pass any arguments to use the default values
        await cli.run(FIXTURE_PATH);

        // Check that the file was actually fixed
        expect(
            StringUtils.splitStringByNewLines(
                await readFile(path.join(FIXTURE_PATH, 'fixable/fixable_file1.txt'), 'utf8'),
            ),
        ).toEqual([
            '! should be fixed',
            '##.class1',
            '##.class2',
            '###id1',
            '',
            '! aglint-disable-next-line',
            '##.class1, .class2, #id1',
            '',
        ]);
    });

    test('works with custom file list', async () => {
        const reporter = new TestReporter();

        const cli = new LinterCli(reporter);

        await cli.run(FIXTURE_PATH, ['dir1/dir1_file1.txt']);

        expect(reporter.getLoggedEvents()).toMatchObject([
            ['onLintStart', null],
            ['onFileStart', path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt'))],
            [
                'onFileEnd',
                {
                    file: path.parse(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt')),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                // eslint-disable-next-line max-len
                                message: "Cannot parse adblock rule due to the following error: Invalid ADG scriptlet call, no closing parentheses ')' found",
                                position: {
                                    startLine: 2,
                                    startColumn: 25,
                                    endLine: 2,
                                    endColumn: 55,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 1,
                    },
                },
            ],
            ['onLintEnd', null],
        ]);
    });

    test('throws error for non-existent files', async () => {
        const reporter = new TestReporter();

        const cli = new LinterCli(reporter);

        await expect(cli.run(FIXTURE_PATH, ['dir1/dir1_file1.txt', 'dir100/dir100_file1.txt'])).rejects.toThrow(
            `File "${path.join(FIXTURE_PATH, 'dir100/dir100_file1.txt')}" does not exist`,
        );
    });

    test('handles absolute file paths correctly', async () => {
        // should work if path exists
        // make 'dir1/dir1_file1.txt' absolute
        const absolutePath = path.resolve(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt'));
        const reporter = new TestReporter();
        const cli = new LinterCli(reporter);
        await cli.run(FIXTURE_PATH, [absolutePath]);
        const loggedEvents = reporter.getLoggedEvents();

        // there are at least 4 events (onLintStart, onFileStart, onFileEnd, onLintEnd)
        // no need to check the exact events here, we already did it in the previous test,
        // we just want to make sure that the absolute path works
        expect(loggedEvents.length).toBeGreaterThanOrEqual(4);

        // should work if path does not exist
        const absolutePathNotExists = path.resolve(path.join(FIXTURE_PATH, 'dir100/dir100_file1.txt'));

        await expect(cli.run(FIXTURE_PATH, [absolutePathNotExists])).rejects.toThrow(
            `File "${absolutePathNotExists}" does not exist`,
        );
    });
});
