import path, { ParsedPath } from 'path';
import fs from 'fs-extra';
import cloneDeep from 'clone-deep';
import { readFile } from 'fs/promises';
import { LinterCli } from '../../../src/linter/cli';
import { LinterCliReporter } from '../../../src/linter/cli/reporter';
import { LinterResult } from '../../../src';
import { StringUtils } from '../../../src/utils/string';

/** Path to the `test/fixtures/cli` directory */
const FIXTURE_SOURCE = path.join('test/fixtures', 'cli');

/** Path to the `test/fixtures/cli-temporary` directory */
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
                                severity: 3,
                                message: 'AGLint parsing error: CSSTree failed to parse selector: Name is expected',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 17,
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
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 29,
                                },
                            },
                        ],
                        warningCount: 1,
                        errorCount: 0,
                        fatalErrorCount: 0,
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
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 29,
                                },
                            },
                            {
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 5,
                                    startColumn: 0,
                                    endLine: 5,
                                    endColumn: 29,
                                },
                            },
                        ],
                        warningCount: 2,
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
                                severity: 3,
                                message: 'AGLint parsing error: CSSTree failed to parse selector: Name is expected',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 17,
                                },
                            },
                        ],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 1,
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
                                message:
                                    // eslint-disable-next-line max-len
                                    'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no opening parentheses "(" at call: ""',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 25,
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
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 29,
                                },
                            },
                        ],
                        warningCount: 1,
                        errorCount: 0,
                        fatalErrorCount: 0,
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
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 29,
                                },
                            },
                            {
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 5,
                                    startColumn: 0,
                                    endLine: 5,
                                    endColumn: 29,
                                },
                            },
                        ],
                        warningCount: 2,
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
                                severity: 3,
                                message: 'AGLint parsing error: CSSTree failed to parse selector: Name is expected',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 17,
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
                        problems: [],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 0,
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
                        problems: [],
                        warningCount: 0,
                        errorCount: 0,
                        fatalErrorCount: 0,
                    },
                },
            ],
            ['onLintEnd', null],
        ]);

        // Check that the files were fixed
        expect(
            StringUtils.splitStringByNewLines(await readFile(path.join(FIXTURE_PATH, 'dir1/dir1_file1.txt'), 'utf8')),
        ).toEqual([
            '! Multiple selectors',
            'example.com##.ad1',
            'example.com##.ad2',
            'example.com##.ad3',
            '',
            '! aglint-disable-next-line',
            'example.com##.ad1, .ad2, .ad3',
            '',
        ]);

        expect(
            StringUtils.splitStringByNewLines(await readFile(path.join(FIXTURE_PATH, 'dir2/dir2_file1.txt'), 'utf8')),
        ).toEqual([
            '! Multiple selectors',
            'example.com##.ad1',
            'example.com##.ad2',
            'example.com##.ad3',
            '',
            '! aglint-disable-next-line',
            'example.com##.ad1',
            'example.com##.ad2',
            'example.com##.ad3',
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
                                rule: 'single-selector',
                                severity: 1,
                                message: 'An element hiding rule should contain only one selector',
                                position: {
                                    startLine: 2,
                                    startColumn: 0,
                                    endLine: 2,
                                    endColumn: 29,
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

    test('throws error for non-existent files', async () => {
        const reporter = new TestReporter();

        const cli = new LinterCli(reporter);

        await expect(cli.run(FIXTURE_PATH, ['dir1/dir1_file1.txt', 'dir100/dir100_file1.txt'])).rejects.toThrowError(
            `File "${path.join(FIXTURE_PATH, 'dir100/dir100_file1.txt')}" does not exist`,
        );
    });
});
