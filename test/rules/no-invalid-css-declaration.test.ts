import { describe, expect, test } from 'vitest';

import { NEWLINE } from '../../src/common/constants';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

describe('no-invalid-css-declaration', () => {
    test('should ignore non-problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-invalid-css-declaration': LinterRuleSeverity.Error,
        };
        // if is closed properly
        expect(
            (await lint(
                [
                    // not contain any CSS
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    'rule',

                    // contain valid CSS
                    '##.foo:has(.bar)',

                    // contain valid declaration
                    '#$#.foo { color: red; }',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);
    });

    test('should detect invalid CSS declarations', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-invalid-css-declaration': LinterRuleSeverity.Error,
        };

        // note: we do not use messageId here, because we got error messages from css-tree
        expect(
            (await lint(
                [
                    '#$#.foo { color: bar; }', // invalid color
                    '#$#.bar { background: url(foo.png) [foo]; }', // invalid background
                    '#$#.bar { foo: url(foo.png); }', // invalid property
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toMatchObject([
            {
                ruleId: 'no-invalid-css-declaration',
                severity: 2,
                position: {
                    start: {
                        line: 1,
                        column: 17,
                    },
                    end: {
                        line: 1,
                        column: 20,
                    },
                },
                message: "Invalid value for 'color' property, mismatch with syntax <color>",
                category: 'problem',
            },
            {
                ruleId: 'no-invalid-css-declaration',
                severity: 2,
                position: {
                    start: {
                        line: 2,
                        column: 35,
                    },
                    end: {
                        line: 2,
                        column: 40,
                    },
                },
                // eslint-disable-next-line max-len
                message: "Invalid value for 'background' property, mismatch with syntax [ <bg-layer> , ]* <final-bg-layer>",
                category: 'problem',
            },
            {
                ruleId: 'no-invalid-css-declaration',
                severity: 2,
                position: {
                    start: {
                        line: 3,
                        column: 10,
                    },
                    end: {
                        line: 3,
                        column: 27,
                    },
                },
                message: 'Unknown property `foo`',
                category: 'problem',
            },
        ]);
    });
});
