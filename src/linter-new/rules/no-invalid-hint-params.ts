import { type Hint } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../rule';

const PLATFORM = 'PLATFORM';
const NOT_PLATFORM = 'NOT_PLATFORM';
const NOT_OPTIMIZED = 'NOT_OPTIMIZED';
const NOT_VALIDATE = 'NOT_VALIDATE';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-hint-params',
            description: 'Checks if hints are parameterized correctly',
            recommended: true,
        },
        messages: {
            unknownPlatform: 'Unknown platform "{{platform}}" in hint "{{hintName}}"',
            hintMustHaveAtLeastOnePlatform: 'Hint "{{hintName}}" must have at least one platform specified',
            hintMustNotHaveAnyParameters: 'Hint "{{hintName}}" must not have any parameters',
        },
    },
    create: (context) => {
        return {
            Hint: (node: Hint) => {
                if (node.name.value === PLATFORM || node.name.value === NOT_PLATFORM) {
                    if (!node.params || node.params.children.length === 0) {
                        context.report({
                            messageId: 'hintMustHaveAtLeastOnePlatform',
                            data: {
                                hintName: node.name.value,
                            },
                            node,
                        });
                    }
                } else if (node.name.value === NOT_OPTIMIZED || node.name.value === NOT_VALIDATE) {
                    // If the hint has any parameters, it's invalid, including "NOT_OPTIMIZED()"
                    if (node.params) {
                        context.report({
                            messageId: 'hintMustNotHaveAnyParameters',
                            data: {
                                hintName: node.name.value,
                            },
                            node,
                        });
                    }
                }
            },
        };
    },
});
