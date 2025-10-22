import { type Value } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-inconsistent-hint-platforms',
            // eslint-disable-next-line max-len
            description: 'Checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM() hint at the same time',
            recommended: true,
        },
        messages: {
            // eslint-disable-next-line max-len
            inconsistentHintPlatforms: 'Platform "{{platform}}" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
        },
    },
    create: (context) => {
        const platforms: Value[] = [];
        const notPlatforms: Value[] = [];

        return {
            'HintCommentRule:exit': () => {
                for (const platform of platforms) {
                    for (const notPlatform of notPlatforms) {
                        if (platform.value === notPlatform.value) {
                            context.report({
                                messageId: 'inconsistentHintPlatforms',
                                data: {
                                    platform: platform.value,
                                },
                                node: platform,
                                // TODO: Add suggestion to remove the platform from one of the hints
                            });
                        }
                    }
                }

                platforms.length = 0;
                notPlatforms.length = 0;
            },
            'Hint[name.value="PLATFORM"] > ParameterList > Value': (node: Value) => {
                platforms.push(node);
            },
            'Hint[name.value="NOT_PLATFORM"] > ParameterList > Value': (node: Value) => {
                notPlatforms.push(node);
            },
        };
    },
});
