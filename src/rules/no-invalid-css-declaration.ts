import { type DeclarationPlain } from '@adguard/ecss-tree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { validateDeclaration } from '../utils/css-utils/css-validator';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-css-declaration',
            description: 'Checks if CSS declarations are valid',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-invalid-css-declaration'),
        },
        correctExamples: [
            {
                name: 'Valid declarations',
                code: [
                    '#$#body { color: red; }',
                    '#$?#body { remove: true; }',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Invalid declarations',
                code: [
                    '#$#body { color: foo; padding: bar; }',
                ].join('\n'),
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        return {
            Declaration: (node: DeclarationPlain) => {
                // special case: `remove` property
                if (node.property === 'remove') {
                    // its value should be `true`
                    if (
                        node.value?.type !== 'Value'
                        || node.value?.children.length !== 1
                        || node.value.children[0]?.type !== 'Identifier'
                        || node.value.children[0].name !== 'true'
                    ) {
                        const position = context.sourceCode.getLinterPositionRangeFromOffsetRange([
                            node.loc!.start.offset,
                            node.loc!.end.offset,
                        ]);

                        if (!position) {
                            return;
                        }

                        context.report({
                            message: 'Value of `remove` property should be `true`',
                            position,
                        });
                    }

                    return;
                }

                validateDeclaration(node).forEach((error) => {
                    const position = context.sourceCode.getLinterPositionRangeFromOffsetRange([
                        error.start!,
                        error.end!,
                    ]);

                    if (!position) {
                        return;
                    }

                    context.report({
                        message: error.message,
                        position,
                    });
                });
            },
        };
    },
});
