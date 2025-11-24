import { type Hint, type ParameterList, type Value } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

const PLATFORM = 'PLATFORM';
const NOT_PLATFORM = 'NOT_PLATFORM';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-hint-platforms',
            description: 'Checks if a platform is used more than once within the same PLATFORM / NOT_PLATFORM hint',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-duplicated-hint-platforms'),
        },
        messages: {
            duplicatedHintPlatforms: 'Duplicated platform "{{platform}}"',
        },
        hasFix: true,
        correctExamples: [
            {
                name: 'No duplicated hint platforms',
                code: [
                    '!+ PLATFORM(windows, mac, ios)',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Duplicated hint platforms',
                code: [
                    '!+ PLATFORM(windows, mac, windows, ios)',
                ].join('\n'),
            },
        ],
        version: '1.0.9',
    },
    create: (context) => {
        let history: Set<string> | null = null;

        return {
            Hint: (node: Hint) => {
                const name = node.name.value;

                if (name !== PLATFORM && name !== NOT_PLATFORM) {
                    return;
                }

                history = new Set();
            },
            'Hint:exit': () => {
                history = null;
            },
            'Hint > ParameterList > Value': (node: Value, parent: ParameterList) => {
                if (!history) {
                    return;
                }

                const platform = node.value;
                const platformToLowerCase = platform.toLowerCase();

                if (!history.has(platformToLowerCase)) {
                    history.add(platformToLowerCase);
                    return;
                }

                context.report({
                    messageId: 'duplicatedHintPlatforms',
                    data: {
                        platform,
                    },
                    node,
                    fix(fixer) {
                        const range = context.getOffsetRangeForNode(node);

                        if (!range) {
                            return null;
                        }

                        const parentRange = context.getOffsetRangeForNode(parent);

                        if (!parentRange) {
                            return null;
                        }

                        const precedingCommaIndex = context.sourceCode.findPreviousUnescapedChar(
                            range[0],
                            ',',
                            parentRange[0],
                        );

                        if (precedingCommaIndex !== null) {
                            return fixer.remove([precedingCommaIndex, range[1]]);
                        }

                        const followingCommaIndex = context.sourceCode.findNextUnescapedChar(
                            range[1],
                            ',',
                            parentRange[1],
                        );

                        if (followingCommaIndex !== null) {
                            return fixer.remove([range[0], followingCommaIndex]);
                        }

                        return fixer.remove(range);
                    },
                });
            },
        };
    },
});
