import { type Parameter } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-inconsistent-hint-platforms',
            // eslint-disable-next-line max-len
            description: 'Checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM() hint at the same time',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-inconsistent-hint-platforms'),
        },
        messages: {
            // eslint-disable-next-line max-len
            inconsistentHintPlatforms: 'Platform "{{platform}}" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
        },
        correctExamples: [
            {
                name: 'PLATFORM and NOT_PLATFORM hint with different platforms',
                code: [
                    '!+ PLATFORM(windows) NOT_PLATFORM(mac)',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'PLATFORM and NOT_PLATFORM hint with the same platform',
                code: [
                    '!+ PLATFORM(windows) NOT_PLATFORM(windows)',
                ].join('\n'),
            },
        ],
    },
    create: (context) => {
        const platforms: Parameter[] = [];
        const notPlatforms: Parameter[] = [];

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
            'Hint[name.value="PLATFORM"] > ParameterList > Parameter': (node: Parameter) => {
                platforms.push(node);
            },
            'Hint[name.value="NOT_PLATFORM"] > ParameterList > Parameter': (node: Parameter) => {
                notPlatforms.push(node);
            },
        };
    },
});
