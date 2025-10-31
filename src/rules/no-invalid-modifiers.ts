import { type Modifier, modifierValidator, type NetworkRule } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-modifiers',
            description: 'Checks modifiers validity for basic (network) rules',
            recommended: true,
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
            'ExceptionRule:exit': () => {
                isExceptionRule = false;
            },
            'NetworkRule Modifier': (node: Modifier) => {
                if (!context.syntax) {
                    return;
                }

                context.syntax.forEach((syntax) => {
                    const validationResult = modifierValidator.validate(syntax, node, isExceptionRule);

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
                });
            },
        };
    },
});
