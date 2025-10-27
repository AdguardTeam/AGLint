import { type CosmeticRule, type ElementHidingRule, type NetworkRule } from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';

const DEFAULT_MIN_RULE_LENGTH = 4;

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
            v.object({
                minLength: v.pipe(
                    v.fallback(v.number(), DEFAULT_MIN_RULE_LENGTH),
                    v.minValue(1),
                ),
            }),
        ]),
    },
    create: (context) => {
        const { minLength } = context.config[0];

        const handler = (node: CosmeticRule | NetworkRule | ElementHidingRule) => {
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
            NetworkRule: handler,
            CssInjectionRule: handler,
            ElementHidingRule: handler,
            ScriptletInjectionRule: handler,
            HtmlFilteringRule: handler,
            JsInjectionRule: handler,
        };
    },
});
