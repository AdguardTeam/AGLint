import { type PreProcessorCommentRule } from '@adguard/agtree';

import { ELSE_DIRECTIVE, ENDIF_DIRECTIVE, IF_DIRECTIVE } from '../../common/constants';
import { defineRule, LinterRuleType } from '../rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'if-directive-balance',
            description: 'Checks if conditional preprocessor directives are structured correctly',
            recommended: true,
        },
        messages: {
            unclosedIf: 'Unclosed "{{directive}}" directive',
            missingIf: 'Using an "{{directive}}" directive without an opening "{{ifDirective}}" directive',
            invalidDirective: 'Invalid usage of preprocessor directive: "{{directive}}"',
        },
    },
    create: (context) => {
        const stack: PreProcessorCommentRule[] = [];

        return {
            PreProcessorCommentRule: (node: PreProcessorCommentRule) => {
                const directive = node.name.value;

                switch (directive) {
                    case IF_DIRECTIVE:
                        stack.push(node);
                        break;

                    case ELSE_DIRECTIVE:
                        // '!#else' can only be used alone without any parameters
                        if (node.params) {
                            context.report({
                                messageId: 'invalidDirective',
                                data: {
                                    directive: ELSE_DIRECTIVE,
                                },
                                node,
                                fix: (fixer) => {
                                    return fixer.remove([node.name.start!, node.params!.end!]);
                                },
                            });
                        }
                        // Check if there is an open "!#if" before "!#else"
                        if (stack.length === 0) {
                            context.report({
                                messageId: 'missingIf',
                                data: {
                                    directive: ELSE_DIRECTIVE,
                                    ifDirective: IF_DIRECTIVE,
                                },
                                node,
                            });
                        }
                        // Otherwise do nothing
                        break;

                    case ENDIF_DIRECTIVE:
                        // '!#endif' can only be used alone without any parameters
                        if (node.params) {
                            context.report({
                                messageId: 'invalidDirective',
                                data: {
                                    directive: ENDIF_DIRECTIVE,
                                },
                                node,
                                fix: (fixer) => {
                                    return fixer.remove([node.name.end!, node.params!.end!]);
                                },
                            });
                        }
                        if (stack.length === 0) {
                            context.report({
                                messageId: 'missingIf',
                                data: {
                                    directive: ENDIF_DIRECTIVE,
                                    ifDirective: IF_DIRECTIVE,
                                },
                                node,
                            });
                        } else {
                            stack.pop();
                        }
                        break;

                    default:
                        // Unsupported directives should be reported by another rule - 'unknown-preprocessor-directives'
                        // so do nothing
                        break;
                }
            },
            'FilterList:exit': () => {
                // If there are any collected "if"s, that means they are not closed
                for (const rule of stack) {
                    context.report({
                        messageId: 'unclosedIf',
                        data: {
                            directive: IF_DIRECTIVE,
                        },
                        node: rule,
                    });
                }
            },
        };
    },
});
