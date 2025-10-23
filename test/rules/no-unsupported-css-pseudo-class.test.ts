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
    'no-unsupported-css-pseudo-class': [LinterRuleSeverity.Error, {
        fuzzyThreshold: 0.6,
    }],
};

describe('no-unsupported-css-pseudo-class', () => {
    test('should work in severity-only mode', async () => {
        expect((await lint('##div:not(.foo)', {
            'no-unsupported-css-pseudo-class': LinterRuleSeverity.Error,
        })).problems).toStrictEqual([]);
    });

    test('should ignore non-problematic cases', async () => {
        expect((await lint('##div:not(.foo)', rulesConfig)).problems).toStrictEqual([]);
        expect((await lint('##input:checked', rulesConfig)).problems).toStrictEqual([]);
    });

    it('should suggest a fix', async () => {
        expect((await lint('##div:rot', rulesConfig)).problems).toMatchObject([
            {
                category: 'problem',
                ruleId: 'no-unsupported-css-pseudo-class',
                severity: LinterRuleSeverity.Error,
                data: {
                    pseudoClass: 'rot',
                },
                messageId: 'unsupportedPseudoClass',
                position: {
                    start: {
                        column: 5,
                        line: 1,
                    },
                    end: {
                        column: 9,
                        line: 1,
                    },
                },
                suggestions: [
                    'not',
                    'root',
                    'if-not',
                    'first-child',
                    'first-of-type',
                    'read-write',
                    'matches-property',
                ].map(
                    (suggestedPseudoClass) => ({
                        data: {
                            suggestedPseudoClass,
                        },
                        fix: {
                            range: [6, 9],
                            text: suggestedPseudoClass,
                        },
                        messageId: 'changePseudoClass',
                    }),
                ),
            },
        ]);
    });

    it('should allow custom pseudo-class configuration', async () => {
        const customConfig: LinterRulesConfig = {
            'no-unsupported-css-pseudo-class': [LinterRuleSeverity.Error, {
                fuzzyThreshold: 0.6,
                additionalSupportedCssPseudoClasses: ['foo'],
            }],
        };

        expect((await lint('##div:foo', customConfig)).problems).toStrictEqual([]);

        expect((await lint('##div:bar', customConfig)).problems).toMatchObject([
            {
                category: 'problem',
                ruleId: 'no-unsupported-css-pseudo-class',
                severity: LinterRuleSeverity.Error,
                data: {
                    pseudoClass: 'bar',
                },
                messageId: 'unsupportedPseudoClass',
            },
        ]);
    });
});
