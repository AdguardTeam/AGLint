import { type PreProcessorCommentRule } from '@adguard/agtree';

import { SUPPORTED_PREPROCESSOR_DIRECTIVES } from '../common/constants';
import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unknown-preprocessor-directives',
            description: 'Checks if a preprocessor directive is known',
            recommended: true,
        },
        messages: {
            unknownPreprocessorDirective: 'Unknown preprocessor directive "{{directive}}"',
        },
    },
    create: (context) => {
        return {
            PreProcessorCommentRule: (node: PreProcessorCommentRule) => {
                const name = node.name.value;

                if (SUPPORTED_PREPROCESSOR_DIRECTIVES.has(name)) {
                    return;
                }

                context.report({
                    messageId: 'unknownPreprocessorDirective',
                    data: {
                        directive: name,
                    },
                    node,
                });
            },
        };
    },
});
