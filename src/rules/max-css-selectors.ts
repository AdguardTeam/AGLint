import { type SelectorListPlain } from '@adguard/ecss-tree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Layout,
        docs: {
            name: 'max-css-selectors',
            description: 'Checks if a CSS selector list contains more than the specified number of selectors',
            recommended: false,
            url: getBuiltInRuleDocumentationUrl('max-css-selectors'),
        },
        messages: {
            multipleSelectors: 'This selector list contains {{count}} selectors, but only {{maxSelectors}} are allowed',
        },
        configSchema: v.tuple([
            v.strictObject({
                maxSelectors: v.pipe(
                    v.optional(v.number(), 1),
                    v.minValue(1),
                    v.description('The maximum number of selectors allowed in a selector list'),
                ),
            }),
        ]),
        defaultConfig: [
            {
                maxSelectors: 1,
            },
        ],
        hasFix: true,
        correctExamples: [
            {
                name: 'Single selector in element hiding rule',
                code: '##.single-selector',
            },
            {
                name: 'Single selector in CSS injection rule',
                code: '#$#.single-selector { display: none; }',
            },
            {
                name: 'Multiple selectors in element hiding rule, maxSelectors: 2',
                code: '##.selector1, .selector2',
                config: [{ maxSelectors: 2 }],
            },
        ],
        incorrectExamples: [
            {
                name: 'Multiple selectors in element hiding rule',
                code: '##.selector1, .selector2',
            },
            {
                name: 'Multiple selectors in CSS injection rule',
                code: '#$#.selector1, .selector2 { display: none; }',
            },
        ],
        version: '1.0.0',
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
