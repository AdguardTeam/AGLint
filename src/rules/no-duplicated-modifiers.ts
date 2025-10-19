import { type Modifier } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter-new/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-modifiers',
            description: 'Checks if a network rule contains multiple same modifiers',
            recommended: true,
        },
        messages: {
            duplicatedModifiers: 'Duplicated modifier "{{modifier}}"',
        },
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
