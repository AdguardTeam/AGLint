import {
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-duplicated-modifiers': LinterRuleSeverity.Error,
};

describe('no-duplicated-modifiers', () => {
    test('should ignore non-problematic cases', async () => {
        // Cosmetic rule
        await expect(lint('example.com##.ad', rulesConfig)).resolves.toMatchObject({ problems: [] });

        // Network rule, but no duplicates
        await expect(lint('||example.com^$script,third-party', rulesConfig)).resolves.toMatchObject({ problems: [] });
    });
    it('should detect problematic cases', async () => {
        // 4x script
        expect((await lint(
            '||example.com^$script,third-party,script,script,script',
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 34,
                        line: 1,
                    },
                    end: {
                        column: 40,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 41,
                        line: 1,
                    },
                    end: {
                        column: 47,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 48,
                        line: 1,
                    },
                    end: {
                        column: 54,
                        line: 1,
                    },
                },
            },
        ]);

        // 5x script, 2x third-party
        expect((await lint(
            '||example.com^$script,third-party,script,script,script,third-party,script,domain=example.net',
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 34,
                        line: 1,
                    },
                    end: {
                        column: 40,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 41,
                        line: 1,
                    },
                    end: {
                        column: 47,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 48,
                        line: 1,
                    },
                    end: {
                        column: 54,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'third-party',
                },
                message: 'Duplicated modifier "third-party"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 55,
                        line: 1,
                    },
                    end: {
                        column: 66,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'script',
                },
                message: 'Duplicated modifier "script"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 67,
                        line: 1,
                    },
                    end: {
                        column: 73,
                        line: 1,
                    },
                },
            },
        ]);

        // 2x domain
        expect((await lint(
            'ads.js$script,domain=example.com,domain=example.net',
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-modifiers',
                severity: LinterRuleSeverity.Error,
                data: {
                    modifier: 'domain',
                },
                message: 'Duplicated modifier "domain"',
                messageId: 'duplicatedModifiers',
                position: {
                    start: {
                        column: 33,
                        line: 1,
                    },
                    end: {
                        column: 51,
                        line: 1,
                    },
                },
            },
        ]);
    });
});
