import { type SelectorListPlain } from '@adguard/ecss-tree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter-new/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Layout,
        docs: {
            name: 'max-css-selectors',
            description: 'Checks if a CSS selector list contains more than the specified number of selectors',
            recommended: false,
        },
        messages: {
            multipleSelectors: 'This selector list contains {{count}} selectors, but only {{maxSelectors}} are allowed',
        },
        configSchema: v.tuple([
            v.strictObject({
                maxSelectors: v.pipe(
                    v.fallback(v.number(), 1),
                    v.minValue(1),
                ),
            }),
        ]),
        hasFix: true,
    },
    create: (context) => {
        const { maxSelectors } = context.config[0];

        const handler = (node: SelectorListPlain) => {
            if (node.children.length <= maxSelectors) {
                return;
            }

            context.report({
                messageId: 'multipleSelectors',
                data: {
                    count: node.children.length,
                    maxSelectors,
                },
                node,
                fix(fixer) {
                    const lineRange = context.sourceCode.getLineRange(node.loc!.start.line, true);
                    const lineBreakType = context.sourceCode.getLinebreakType(node.loc!.start.line);

                    if (!lineRange) {
                        return null;
                    }

                    const ruleTextBeforeSelectorList = context.sourceCode.getSlicedPart(
                        lineRange![0],
                        node.loc!.start.offset,
                    );

                    const ruleTextAfterSelectorList = context.sourceCode.getSlicedPart(
                        node.loc!.end.offset,
                        lineRange![1],
                    );

                    const rules: string[] = [];

                    for (const selector of node.children) {
                        let rule = ruleTextBeforeSelectorList;
                        rule += context.sourceCode.getSlicedPart(
                            selector.loc!.start.offset,
                            selector.loc!.end.offset,
                        );
                        rule += ruleTextAfterSelectorList;
                        rules.push(rule);
                    }

                    let fix: string;

                    // e.g. last line without line break
                    if (lineBreakType === null) {
                        fix = rules.join(context.sourceCode.getDominantLineBreak());
                    } else {
                        fix = rules.join('');
                    }

                    return fixer.replaceWithText(lineRange!, fix);
                },
            });
        };

        return {
            'ElementHidingRuleBody SelectorList': handler,
            'CssInjectionRuleBody SelectorList': handler,
        };
    },
});
