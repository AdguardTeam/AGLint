import { type AnyCosmeticRule, type AnyNetworkRule } from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { createVisitorsForAnyCosmeticRule, createVisitorsForAnyNetworkRule } from '../utils/visitor-creator';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-short-rules',
            description: 'Checks if a rule is too short',
            recommended: true,
        },
        messages: {
            // eslint-disable-next-line max-len
            tooShortRule: 'Rule is too short, its length is {{length}}, but at least {{minLength}} characters are required',
        },
        configSchema: v.tuple([
            v.strictObject({
                minLength: v.pipe(
                    v.number(),
                    v.minValue(1),
                    v.description('Minimum rule length'),
                ),
            }),
        ]),
        defaultConfig: [
            {
                minLength: 4,
            },
        ],
        correctExamples: [
            {
                name: 'Long enough rule',
                code: '||example.com^',
            },
        ],
        incorrectExamples: [
            {
                name: 'Too short rule',
                code: '||a',
            },
        ],
        version: '2.0.3',
    },
    create: (context) => {
        const { minLength } = context.config[0];

        const handler = (node: AnyCosmeticRule | AnyNetworkRule) => {
            const sourceText = node.raws?.text;

            if (!sourceText) {
                return;
            }
            const ruleTextTrimmed = sourceText.trim();

            if (ruleTextTrimmed.length < minLength) {
                context.report({
                    messageId: 'tooShortRule',
                    data: {
                        minLength,
                        length: ruleTextTrimmed.length,
                    },
                    node,
                });
            }
        };

        return {
            ...createVisitorsForAnyCosmeticRule(handler),
            ...createVisitorsForAnyNetworkRule(handler),
        };
    },
});
