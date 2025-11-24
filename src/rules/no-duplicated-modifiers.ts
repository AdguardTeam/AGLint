import { type Modifier } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-modifiers',
            description: 'Checks if a network rule contains multiple same modifiers',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-duplicated-modifiers'),
        },
        messages: {
            duplicatedModifiers: 'Duplicated modifier "{{modifier}}"',
        },
        correctExamples: [
            {
                name: 'Network rule, single `script` and `third-party` modifiers',
                code: [
                    '||example.com^$script,third-party',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Network rule, multiple repeated `script` and `third-party` modifiers',
                code: [
                    '||example.com^$script,third-party,script',
                ].join('\n'),
            },
            {
                name: 'Network rule, multiple repeated `domain` modifier',
                code: [
                    'ads.js$script,domain=example.com,domain=example.net',
                ].join('\n'),
            },
        ],
    },
    create: (context) => {
        const history = new Set<string>();

        return {
            'ModifierList:exit': () => {
                history.clear();
            },
            Modifier: (node: Modifier) => {
                const name = node.name.value;
                const nameToLowerCase = name.toLowerCase();

                if (!history.has(nameToLowerCase)) {
                    history.add(nameToLowerCase);
                    return;
                }

                context.report({
                    messageId: 'duplicatedModifiers',
                    data: {
                        modifier: name,
                    },
                    node,
                    // TODO: Add suggestion to remove the duplicated modifier
                });
            },
        };
    },
});
