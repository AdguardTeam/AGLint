import { Linter } from "../../../src/linter";
import { IfClosed } from "../../../src/linter/rules/if-closed";
import { NEWLINE } from "../../../src/utils/constants";

describe("if-closed", () => {
    test("Detects unclosed if-s", () => {
        // Create and configure linter
        const linter = new Linter(false);

        linter.addRule("if-closed", IfClosed);

        // Problem-free rules
        expect(
            linter.lint(
                [
                    // Rules:
                    "rule",
                    "!#if (condition1)",
                    "rule",
                    "!#endif",
                    "rule",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(
                [
                    // Rules:
                    "rule",
                    "!#if (condition1)",
                    "!#if (condition2)",
                    "rule",
                    "!#endif",
                    "rule",
                    "!#endif",
                    "rule",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // If-s are not closed
        expect(
            linter.lint(
                [
                    // Rules:
                    "rule",
                    "!#if (condition1)",
                    "!#if (condition2)",
                    "rule",
                    "!#endif",
                    "rule",
                    "rule",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "if-closed",
                    severity: 2,
                    message: 'Unclosed "if" directive',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 17,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });
    });

    test("Detects unopened endif-s", () => {
        const linter = new Linter(false);

        // Add if-closed rule
        linter.addRule("if-closed", IfClosed);

        expect(
            linter.lint(
                [
                    // Rules:
                    "rule",
                    "!#if (condition1)",
                    "rule",
                    "!#endif",
                    "!#endif",
                    "rule",
                    "rule",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "if-closed",
                    severity: 2,
                    message: 'Using an "endif" directive without an opening "if" directive',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 7,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });
    });
});
