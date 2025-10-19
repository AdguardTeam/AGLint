import { type Domain, type DomainList, DomainUtils } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter-new/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-domains',
            description: 'Disallows invalid domains',
            recommended: true,
        },
        messages: {
            invalidDomain: 'Invalid domain "{{domain}}"',
            removeInvalidDomain: 'Remove invalid domain "{{domain}}"',
        },
        hasSuggestions: true,
    },
    create: (context) => {
        let separator: string | undefined;
        let end: number | undefined;

        return {
            DomainList: (node: DomainList) => {
                separator = node.separator;
                end = node.end;
            },
            'DomainList:exit': () => {
                separator = undefined;
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
                                        nextSeparatorOffset,
                                    ]);
                                }

                                const previousSeparatorOffset = context.sourceCode.findPreviousUnescapedChar(
                                    node.start!,
                                    separator!,
                                    end,
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
