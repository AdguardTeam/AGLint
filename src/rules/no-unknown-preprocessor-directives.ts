import { type PreProcessorCommentRule } from '@adguard/agtree';

import { SUPPORTED_PREPROCESSOR_DIRECTIVES } from '../common/constants';
import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unknown-preprocessor-directives',
            description: 'Checks if a preprocessor directive is known',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-unknown-preprocessor-directives'),
        },
        messages: {
            unknownPreprocessorDirective: 'Unknown preprocessor directive "{{directive}}"',
        },
        correctExamples: [
            {
                name: 'Valid preprocessor directive',
                code: '!#if (conditions_2)',
            },
        ],
        incorrectExamples: [
            {
                name: 'Invalid preprocessor directive',
                code: '!#if2 (conditions_2)',
            },
        ],
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
