import { Linter } from '../../../src/linter';
import { NEWLINE } from '../../../src/common/constants';
import { NoExcludedRules } from '../../../src/linter/rules/no-excluded-rules';
import { SEVERITY } from '../../../src/linter/severity';

let linter: Linter;

describe('no-excluded-rules', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('no-excluded-rules', NoExcludedRules);
    });

    test('should match one specified excluded rule', () => {
        linter.setRuleConfig(
            'no-excluded-rules',
            [
                'error',
                {
                    'regexp-patterns': [
                        String.raw`example\.com\/bad\/query\/`,
                    ],
                },
            ],
        );

        // Zero bad rules
        expect(
            linter.lint(
                [
                    'example.com/good/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // One bad rule
        expect(
            linter.lint(
                [
                    'example.com/good/query/',
                    'example.com/bad/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'no-excluded-rules',
                    severity: SEVERITY.error,
                    message: `Rule matches an excluded pattern: ${String.raw`/example\.com\/bad\/query\//`}`,
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 22,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });

        // Multiple bad same rules
        expect(
            linter.lint(
                [
                    'example.com/bad/query/',
                    'example.com/good/query/',
                    'example.com/bad/query/',
                    'example.com/another-not-bad/query/',
                    'example.com/bad/query/',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'no-excluded-rules',
                    severity: SEVERITY.error,
                    message: `Rule matches an excluded pattern: ${String.raw`/example\.com\/bad\/query\//`}`,
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 22,
                    },
                },
                {
                    rule: 'no-excluded-rules',
                    severity: SEVERITY.error,
                    message: `Rule matches an excluded pattern: ${String.raw`/example\.com\/bad\/query\//`}`,
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 22,
                    },
                },
                {
                    rule: 'no-excluded-rules',
                    severity: SEVERITY.error,
                    message: `Rule matches an excluded pattern: ${String.raw`/example\.com\/bad\/query\//`}`,
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 22,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 3,
            fatalErrorCount: 0,
        });
    });

    test('should match different specified excluded rules', () => {
        linter.setRuleConfig(
            'no-excluded-rules',
            [
                'error',
                {
                    'regexp-patterns': [
                        String.raw`example\.(com|org)\/bad\/query\/`,
                    ],
                },
            ],
        );

        // Zero bad rules
        expect(
            linter.lint(
                [
                    'example.com/good/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Two bad rules
        expect(
            linter.lint(
                [
                    'example.com/good/query/',
                    'example.com/bad/query/',
                    'example.com/another-not-bad/query/',
                    'example.org/bad/query/',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'no-excluded-rules',
                    severity: SEVERITY.error,
                    message: `Rule matches an excluded pattern: ${String.raw`/example\.(com|org)\/bad\/query\//`}`,
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 22,
                    },
                },
                {
                    rule: 'no-excluded-rules',
                    severity: SEVERITY.error,
                    message: `Rule matches an excluded pattern: ${String.raw`/example\.(com|org)\/bad\/query\//`}`,
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 22,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 2,
            fatalErrorCount: 0,
        });
    });
});
