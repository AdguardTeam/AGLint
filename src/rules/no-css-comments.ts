import { type Comment } from '@adguard/ecss-tree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Layout,
        docs: {
            name: 'no-css-comments',
            description: 'Disallows CSS comments',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-css-comments'),
        },
        messages: {
            noComments: 'CSS comments are not allowed',
        },
        hasFix: true,
        correctExamples: [
            {
                name: 'No CSS comments',
                code: [
                    '##.ad',
                    '#$#body { padding: 10px; }',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'CSS comments in the selector list',
                code: [
                    '##.ad /* comment */',
                ].join('\n'),
            },
            {
                name: 'CSS comments in the declaration list',
                code: [
                    '#$#body { color: red; /* comment */ color: blue; }',
                ].join('\n'),
            },
            {
                name: 'Multiple CSS comments',
                code: [
                    '#$#/* comment */body /* comment */ { color: /* comment */ red; }',
                ].join('\n'),
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        const handler = (node: Comment) => {
            context.report({
                messageId: 'noComments',
                node,
                fix(fixer) {
                    const range = context.getOffsetRangeForNode(node);

                    if (!range) {
                        return null;
                    }

                    return fixer.remove(range);
                },
            });
        };

        return {
            'SelectorList Comment': handler,
            'DeclarationList Comment': handler,
            'MediaQueryList Comment': handler,
        };
    },
});
