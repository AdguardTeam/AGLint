import {
    GenericPlatform,
    type Modifier,
    modifierValidator,
    type NetworkRule,
} from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-modifiers',
            description: 'Checks modifiers validity for basic (network) rules',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-invalid-modifiers'),
        },
        messages: {
            invalidModifier: 'Invalid modifier: "{{modifier}}", got "{{validationError}}"',
        },
        correctExamples: [
            {
                name: 'Valid `script` and `third-party` modifiers',
                code: [
                    '||example.com^$script,third-party',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Invalid `foo` modifier',
                code: [
                    '||example.com^$foo',
                ].join('\n'),
            },
        ],
    },
    create: (context) => {
        let isExceptionRule = false;

        /**
         * Validates a modifier against a specific platform.
         *
         * @param platform The platform to validate against.
         * @param node The modifier node to validate.
         */
        const validateModifierForPlatform = (platform: number, node: Modifier) => {
            const validationResult = modifierValidator.validate(platform, node, isExceptionRule);

            if (validationResult.valid && !validationResult.warn) {
                return;
            }

            // TODO (David): Include warnings somewhere else.
            // We validate too many things in validator at once thus
            // its hard to split it to multiple linter rules.
            if (validationResult.warn) {
                return;
            }

            context.report({
                messageId: 'invalidModifier',
                data: {
                    modifier: node.name.value,
                    validationError: validationResult.error,
                },
                node,
            });
        };

        return {
            NetworkRule: (node: NetworkRule) => {
                isExceptionRule = node.exception;
            },
            'NetworkRule:exit': () => {
                isExceptionRule = false;
            },
            'NetworkRule Modifier': (node: Modifier) => {
                // If no platform specified, validate against generic "any" platform
                if (context.platforms === 0) {
                    validateModifierForPlatform(GenericPlatform.Any, node);
                    return;
                }

                // Validate against all configured platforms
                const platformsByProduct = Object.values(context.platformsByProduct);
                platformsByProduct.forEach((platforms) => {
                    platforms.forEach((platform) => {
                        validateModifierForPlatform(platform, node);
                    });
                });
            },
        };
    },
});
