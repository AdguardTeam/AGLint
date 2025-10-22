import { type Hint } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';

const NOT_OPTIMIZED = 'NOT_OPTIMIZED';
const PLATFORM = 'PLATFORM';
const NOT_PLATFORM = 'NOT_PLATFORM';
const NOT_VALIDATE = 'NOT_VALIDATE';

// https://adguard.com/kb/general/ad-filtering/create-own-filters/#hints
const KNOWN_HINTS = new Set([
    NOT_OPTIMIZED,
    PLATFORM,
    NOT_PLATFORM,
    NOT_VALIDATE,
]);

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unknown-hints',
            description: 'Checks if hints are known',
            recommended: true,
        },
        messages: {
            unknownHintName: 'Unknown hint name "{{hintName}}"',
        },
    },
    create: (context) => {
        return {
            Hint: (node: Hint) => {
                if (KNOWN_HINTS.has(node.name.value)) {
                    return;
                }

                context.report({
                    messageId: 'unknownHintName',
                    data: {
                        hintName: node.name.value,
                    },
                    node,
                });
            },
        };
    },
});
