import { describe, expect, test } from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-invalid-cosmetic-separator': LinterRuleSeverity.Error,
};

describe('no-invalid-cosmetic-separator', () => {
    describe('should ignore non-problematic cases', () => {
        test.each([
            '##div:has(> table)',
            '#$?#a[href^="/bnlink/?bnid="] { remove: true; }',
            '#@#div',
        ])("'%s'", async (rule) => {
            expect((await lint(rule, rulesConfig)).problems).toStrictEqual([]);
        });
    });

    describe('should detect problematic cases', () => {
        test.each([
            {
                actual: '##div:contains(a)',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-invalid-cosmetic-separator',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'useExtendedSeparator',
                        data: {
                            current: '##',
                            suggested: '#?#',
                        },
                        message: 'Extended CSS is used in selector, replace "##" with "#?#"',
                        position: {
                            end: {
                                column: 17,
                                line: 1,
                            },
                            start: {
                                column: 2,
                                line: 1,
                            },
                        },
                        suggestions: [
                            {
                                data: {
                                    suggested: '#?#',
                                },
                                fix: {
                                    range: [
                                        0,
                                        2,
                                    ],
                                    text: '#?#',
                                },
                                messageId: 'changeSeparator',
                                message: 'Change separator to "#?#"',
                            },
                        ],
                    },
                ],
            },
            {
                actual: '#@#div { remove: true; }',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-invalid-cosmetic-separator',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'removeOnlyWithExtended',
                        data: {
                            required: '#@$?#',
                        },
                        message: 'Declaration { remove: true; } is allowed only with "#@$?#" separator',
                        position: {
                            end: {
                                column: 24,
                                line: 1,
                            },
                            start: {
                                column: 3,
                                line: 1,
                            },
                        },
                        suggestions: [
                            {
                                data: {
                                    suggested: '#@$?#',
                                },
                                fix: {
                                    range: [
                                        0,
                                        3,
                                    ],
                                    text: '#@$?#',
                                },
                                message: 'Change separator to "#@$?#"',
                                messageId: 'changeSeparator',
                            },
                        ],
                    },
                ],
            },
            {
                actual: '#?#div',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-invalid-cosmetic-separator',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'useNativeSeparator',
                        data: {
                            current: '#?#',
                            suggested: '##',
                        },
                        message: 'Native CSS selector detected, replace "#?#" with "##"',
                        position: {
                            end: {
                                column: 6,
                                line: 1,
                            },
                            start: {
                                column: 3,
                                line: 1,
                            },
                        },
                        suggestions: [
                            {
                                data: {
                                    suggested: '##',
                                },
                                fix: {
                                    range: [
                                        0,
                                        3,
                                    ],
                                    text: '##',
                                },
                                messageId: 'changeSeparator',
                                message: 'Change separator to "##"',
                            },
                        ],
                    },
                ],
            },
            {
                actual: '#$?#div { padding-top: 0 !important; }',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-invalid-cosmetic-separator',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'useNativeSeparator',
                        data: {
                            current: '#$?#',
                            suggested: '#$#',
                        },
                        message: 'Native CSS selector detected, replace "#$?#" with "#$#"',
                        position: {
                            end: {
                                column: 38,
                                line: 1,
                            },
                            start: {
                                column: 4,
                                line: 1,
                            },
                        },
                        suggestions: [
                            {
                                data: {
                                    suggested: '#$#',
                                },
                                fix: {
                                    range: [
                                        0,
                                        4,
                                    ],
                                    text: '#$#',
                                },
                                messageId: 'changeSeparator',
                                message: 'Change separator to "#$#"',
                            },
                        ],
                    },
                ],
            },
        ])("'%s'", async ({ actual, expected }) => {
            expect((await lint(actual, rulesConfig)).problems).toStrictEqual(expected);
        });
    });
});
