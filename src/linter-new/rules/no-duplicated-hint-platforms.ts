import { type Hint, type Value } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../rule';

const PLATFORM = 'PLATFORM';
const NOT_PLATFORM = 'NOT_PLATFORM';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-hint-platforms',
            description: 'Checks if a platform is used more than once within the same PLATFORM / NOT_PLATFORM hint',
            recommended: true,
        },
        messages: {
            duplicatedHintPlatforms: 'Duplicated platform "{{platform}}"',
        },
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
            'Hint > ParameterList > Value': (node: Value) => {
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
                    // TODO: Add suggestion to remove the duplicated platform
                });
            },
        };
    },
});
