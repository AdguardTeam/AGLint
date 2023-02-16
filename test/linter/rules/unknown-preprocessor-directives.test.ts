import { Linter } from "../../../src/linter";
import { UnknownPreProcessorDirectives } from "../../../src/linter/rules/unknown-preprocessor-directives";
import { NEWLINE } from "../../../src/utils/constants";

describe("unknown-preprocessor-directives", () => {
    test("Detects unknown preprocessor directives", () => {
        // Create and configure linter
        const linter = new Linter(false);

        linter.addRule("unknown-preprocessor-directives", UnknownPreProcessorDirectives);

        // Problem-free rules
        expect(
            linter.lint(
                [
                    // Rules:
                    `!#include https://example.org/path/includedfile.txt`,
                    `!#if (conditions)`,
                    `!#if (conditions_2)`,
                    `!#endif`,
                    `!#endif`,
                    `!#safari_cb_affinity`,
                    `!#safari_cb_affinity()`,
                    `!#safari_cb_affinity(params)`,
                    `!#safari_cb_affinity(general,privacy)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Problematic rules
        expect(
            linter.lint(
                [
                    // Rules:
                    `!#incl2ude https://example.org/path/includedfile.txt`,
                    `!#IF (conditions)`,
                    `!#if2 (conditions_2)`,
                    `!#end-if`,
                    `!#something`,
                    `!#endif`,
                    `!#safari_cb_affinity(`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message: 'Unknown preprocessor directive "incl2ude"',
                    position: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 52 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message: 'Unknown preprocessor directive "IF"',
                    position: { startLine: 2, startColumn: 0, endLine: 2, endColumn: 17 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message: 'Unknown preprocessor directive "if2"',
                    position: { startLine: 3, startColumn: 0, endLine: 3, endColumn: 20 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message: 'Unknown preprocessor directive "end-if"',
                    position: { startLine: 4, startColumn: 0, endLine: 4, endColumn: 8 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message: 'Unknown preprocessor directive "something"',
                    position: { startLine: 5, startColumn: 0, endLine: 5, endColumn: 11 },
                },
                {
                    rule: "unknown-preprocessor-directives",
                    severity: 2,
                    message: 'Unknown preprocessor directive "safari_cb_affinity("',
                    position: { startLine: 7, startColumn: 0, endLine: 7, endColumn: 21 },
                },
            ],
            warningCount: 0,
            errorCount: 6,
            fatalErrorCount: 0,
        });
    });
});
