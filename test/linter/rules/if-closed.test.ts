import { Linter } from '../../../src/linter';
import { IfClosed } from '../../../src/linter/rules/if-closed';
import { NEWLINE } from '../../../src/common/constants';

let linter: Linter;

describe('if-closed', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('if-closed', IfClosed);
    });

    test('should ignore non-problematic cases', () => {
        // if is closed properly
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });

        // both if-s are closed properly
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#if (condition2)',
                    'rule',
                    '!#endif',
                    'rule',
                    '!#endif',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test('should detect unclosed if-s', () => {
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#if (condition2)',
                    'rule',
                    '!#endif',
                    'rule',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
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

    test('should detect unopened endif-s', () => {
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    '!#endif',
                    'rule',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
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
