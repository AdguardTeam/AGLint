import {
    type Modifier,
    modifierValidator,
    type NetworkRule,
    Platform,
    PlatformExpressionEvaluator,
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

        return {
            NetworkRule: (node: NetworkRule) => {
                isExceptionRule = node.exception;
            },
            'NetworkRule:exit': () => {
                isExceptionRule = false;
            },
            'NetworkRule Modifier': (node: Modifier) => {
                // If no platform specified, validate against the generic "any"
                // platform. Otherwise, expand wildcards to their concrete
                // platforms, since platform-specific data (e.g. MV3) may differ.
                const platformsToValidate = context.platforms.length === 0
                    ? [Platform.Any]
                    : context.platforms.flatMap((platform) => (
                        platform.isWildcard
                            ? PlatformExpressionEvaluator.evaluate(platform.toString())
                            : [platform]
                    ));

                // The same validation error can be produced for several
                // platforms, so report each distinct error only once.
                const errors = new Set<string>();

                platformsToValidate.forEach((platform) => {
                    const validationResult = modifierValidator.validate(
                        [platform],
                        node,
                        isExceptionRule,
                    );

                    // TODO (David): Include warnings somewhere else.
                    // We validate too many things in validator at once thus
                    // its hard to split it to multiple linter rules.
                    if (
                        !validationResult.valid
                        && !validationResult.warn
                        && validationResult.error
                    ) {
                        errors.add(validationResult.error);
                    }
                });

                for (const validationError of errors) {
                    context.report({
                        messageId: 'invalidModifier',
                        data: {
                            modifier: node.name.value,
                            validationError,
                        },
                        node,
                    });
                }
            },
        };
    },
});
