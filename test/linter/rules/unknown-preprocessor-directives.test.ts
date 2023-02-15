import { Linter } from "../../../src/linter";
import { UnknownPreProcessorDirectives } from "../../../src/linter/rules/unknown-preprocessor-directives";
import { NEWLINE } from "../../../src/utils/constants";

describe("unknown-preprocessor-directives", () => {
    test("Detects unknown preprocessor directives", () => {
        const linter = new Linter(false);

        linter.addRule("unknown-preprocessor-directives", UnknownPreProcessorDirectives);

        // No multiple selectors
        expect(
            linter.lint(
                [
                    `!#include https://example.org/path/includedfile.txt`,
                    `!#if (conditions)`,
                    `!#if (conditions_2)`,
                    `!#endif`,
                    `!#endif`,
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
                    `!#incl2ude https://example.org/path/includedfile.txt`,
                    `!#IF (conditions)`,
                    `!#if2 (conditions_2)`,
                    `!#end-if`,
                    `!#something`,
                    `!#endif`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Unknown preprocessor directive "incl2ude", known preprocessor directives are: if, endif, include',
                    position: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 52 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message:
                        'Unknown preprocessor directive "IF", known preprocessor directives are: if, endif, include',
                    position: { startLine: 2, startColumn: 0, endLine: 2, endColumn: 17 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message:
                        'Unknown preprocessor directive "if2", known preprocessor directives are: if, endif, include',
                    position: { startLine: 3, startColumn: 0, endLine: 3, endColumn: 20 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Unknown preprocessor directive "end-if", known preprocessor directives are: if, endif, include',
                    position: { startLine: 4, startColumn: 0, endLine: 4, endColumn: 8 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Unknown preprocessor directive "something", known preprocessor directives are: if, endif, include',
                    position: { startLine: 5, startColumn: 0, endLine: 5, endColumn: 11 },
                },
            ],
            warningCount: 0,
            errorCount: 5,
            fatalErrorCount: 0,
        });
    });
});
