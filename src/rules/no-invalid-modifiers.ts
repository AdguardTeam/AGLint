import { type Modifier, modifierValidator } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter-new/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-modifiers',
            description: 'Checks modifiers validity for basic (network) rules',
            recommended: true,
        },
        messages: {
            invalidModifier: 'Invalid modifier: "{{modifier}}"',
        },
    },
    create: (context) => {
        return {
            'NetworkRule Modifier': (node: Modifier) => {
                if (!context.syntax) {
                    return;
                }

                context.syntax.forEach((syntax) => {
                    const validationResult = modifierValidator.validate(syntax, node, node.exception);

                    if (validationResult.valid && !validationResult.warn) {
                        return;
                    }

                    // FIXME: Include warnings somewhere else
                    // We validate too many things in validator at once thus
                    // its hard to split it to multiple linter rules
                    if (validationResult.warn) {
                        return;
                    }

                    context.report({
                        messageId: 'invalidModifier',
                        data: {
                            modifier: node.value,
                        },
                        node,
                    });
                });
            },
        };
    },
});
