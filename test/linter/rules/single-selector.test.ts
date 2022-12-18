/* eslint-disable max-len */
import { Linter } from "../../../src/linter";
import { SingleSelector } from "../../../src/linter/rules/single-selector";
import { NEWLINE } from "../../../src/utils/constants";

describe("single-selector", () => {
    test("Detects multiple selectors", () => {
        const linter = new Linter();

        // Add single-selector rule
        linter.addRule("single-selector", SingleSelector);

        // No multiple selectors
        expect(
            linter.lint(
                [
                    "example.com##.ad1",
                    "example.com##.ad2",
                    "example.com##.ad3",
                    "example.com##.ad4",
                    "example.com##.ad5",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Multiple selectors
        expect(
            linter.lint(
                [
                    "example.com##.ad1",
                    "example.com##.ad2,.ad3", // multiple selectors
                    "example.com##.ad4",
                    "example.com##.ad5, .ad6,.ad7", //  multiple selectors
                    "example.com##.ad8",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "single-selector",
                    severity: 1,
                    message: "An element hiding rule should contain only one selector",
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 22,
                    },
                },
                {
                    rule: "single-selector",
                    severity: 1,
                    message: "An element hiding rule should contain only one selector",
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 28,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test("Suggest fix", () => {
        const linter = new Linter();

        // Add single-selector rule
        linter.addRule("single-selector", SingleSelector);

        // No multiple selectors
        expect(
            linter.lint(
                [
                    "example.com##.ad1",
                    "example.com##.ad2",
                    "example.com##.ad3",
                    "example.com##.ad4",
                    "example.com##.ad5",
                ].join(NEWLINE),
                true
            )
        ).toMatchObject({
            fixed: [
                "example.com##.ad1",
                "example.com##.ad2",
                "example.com##.ad3",
                "example.com##.ad4",
                "example.com##.ad5",
            ].join(NEWLINE),
        });

        // Multiple selectors
        expect(
            linter.lint(
                [
                    "example.com##.ad1",
                    "example.com##.ad2,.ad3", // multiple selectors
                    "example.com##.ad4",
                    "example.com##.ad5, .ad6,.ad7", //  multiple selectors
                    "example.com##.ad8",
                ].join(NEWLINE),
                true
            )
        ).toMatchObject({
            fixed: [
                "example.com##.ad1",
                "example.com##.ad2",
                "example.com##.ad3",
                "example.com##.ad4",
                "example.com##.ad5",
                "example.com##.ad6",
                "example.com##.ad7",
                "example.com##.ad8",
            ].join(NEWLINE),
        });
    });
});
