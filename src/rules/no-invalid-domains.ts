import { type Domain, type DomainList, DomainUtils } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-domains',
            description: 'Disallows invalid domains',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-invalid-domains'),
        },
        messages: {
            invalidDomain: 'Invalid domain "{{domain}}"',
            removeInvalidDomain: 'Remove invalid domain "{{domain}}"',
        },
        hasSuggestions: true,
        correctExamples: [
            {
                name: 'Valid domains',
                code: [
                    'example.*##.ad',
                    'pelda.hu##.ad',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Invalid domain',
                code: [
                    'example. com##.ad',
                ].join('\n'),
            },
        ],
        version: '1.0.9',
    },
    create: (context) => {
        let separator: string | undefined;
        let start: number | undefined;
        let end: number | undefined;

        return {
            DomainList: (node: DomainList) => {
                separator = node.separator;
                start = node.start;
                end = node.end;
            },
            'DomainList:exit': () => {
                separator = undefined;
                start = undefined;
                end = undefined;
            },
            Domain: (node: Domain) => {
                if (DomainUtils.isValidDomainOrHostname(node.value)) {
                    return;
                }

                context.report({
                    messageId: 'invalidDomain',
                    data: {
                        domain: node.value,
                    },
                    node,
                    suggest: [
                        {
                            messageId: 'removeInvalidDomain',
                            data: {
                                domain: node.value,
                            },
                            fix: (fixer) => {
                                const nextSeparatorOffset = context.sourceCode.findNextUnescapedChar(
                                    node.start!,
                                    separator!,
                                    end,
                                );

                                if (nextSeparatorOffset !== null) {
                                    return fixer.remove([
                                        node.start!,
                                        nextSeparatorOffset + 1,
                                    ]);
                                }

                                const previousSeparatorOffset = context.sourceCode.findPreviousUnescapedChar(
                                    node.start!,
                                    separator!,
                                    start,
                                );

                                if (previousSeparatorOffset !== null) {
                                    return fixer.remove([
                                        previousSeparatorOffset,
                                        node.end!,
                                    ]);
                                }

                                const range = context.getOffsetRangeForNode(node);

                                return fixer.remove(range!);
                            },
                        },
                    ],
                });
            },
        };
    },
});
