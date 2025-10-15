import { type Hint } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-hints',
            description: 'Checks if hints are duplicated within the same hint comment rule',
            recommended: true,
        },
        messages: {
            duplicatedHints: 'Duplicated hint "{{hint}}"',
        },
    },
    create: (context) => {
        const history: Set<string> = new Set();

        return {
            'HintCommentRule:exit': () => {
                history.clear();
            },
            Hint: (node: Hint) => {
                const name = node.name.value;
                const nameToLowerCase = name.toLowerCase();

                if (!history.has(nameToLowerCase)) {
                    history.add(nameToLowerCase);
                    return;
                }

                context.report({
                    messageId: 'duplicatedHints',
                    data: {
                        hint: name,
                    },
                    node,
                    // TODO: Add suggestion to remove the duplicated hint
                });
            },
        };
    },
});
