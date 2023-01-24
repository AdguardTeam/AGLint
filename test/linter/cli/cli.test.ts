import path, { ParsedPath } from "path";
import fs from "fs-extra";
import { LinterCli } from "../../../src/linter/cli";
import { LinterCliReporter } from "../../../src/linter/cli/reporter";
import { LinterResult } from "../../../src";
import cloneDeep from "clone-deep";

/** Path to the `test/fixtures/cli` directory */
const FIXTURE_SOURCE = path.join("test/fixtures", "cli");

/** Path to the `test/fixtures/cli-temporary` directory */
const FIXTURE_PATH = path.join("test/fixtures", "cli-temporary");

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
        this.events.push(["onLintStart", null]);
    };

    onFileStart = (file: ParsedPath) => {
        this.events.push(["onFileStart", file]);
    };

    onFileEnd = (file: ParsedPath, result: LinterResult) => {
        this.events.push(["onFileEnd", { file, result }]);
    };

    onLintEnd = () => {
        this.events.push(["onLintEnd", null]);
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

describe("CLI tests", () => {
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

    test("works with default configuration", async () => {
        const reporter = new TestReporter();

        // Leave 2nd and 3rd argument empty to use default values
        const cli = new LinterCli(reporter);

        // Don't pass any arguments to use the default values
        await cli.run(FIXTURE_PATH);

        expect(reporter.getLoggedEvents()).toMatchObject([
            ["onLintStart", null],
            ["onFileStart", path.parse(path.join(FIXTURE_PATH, "root_file1.txt"))],
            [
                "onFileEnd",
                {
                    file: path.parse(path.join(FIXTURE_PATH, "root_file1.txt")),
                    result: {
                        problems: [
                            {
                                severity: 3,
                                message: "AGLint parsing error: Name is expected",
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
            ["onFileStart", path.parse(path.join(FIXTURE_PATH, "dir1/dir1_file1.txt"))],
            [
                "onFileEnd",
                {
                    file: path.parse(path.join(FIXTURE_PATH, "dir1/dir1_file1.txt")),
                    result: {
                        problems: [
                            {
                                rule: "single-selector",
                                severity: 1,
                                message: "An element hiding rule should contain only one selector",
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
            ["onFileStart", path.parse(path.join(FIXTURE_PATH, "dir1/dir1_file2.txt"))],
            ["onFileStart", path.parse(path.join(FIXTURE_PATH, "dir2/dir2_file1.txt"))],
            [
                "onFileEnd",
                {
                    file: path.parse(path.join(FIXTURE_PATH, "dir2/dir2_file1.txt")),
                    result: {
                        problems: [
                            {
                                rule: "single-selector",
                                severity: 1,
                                message: "An element hiding rule should contain only one selector",
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
            ["onLintEnd", null],
        ]);
    });
});
