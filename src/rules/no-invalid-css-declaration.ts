import { type DeclarationPlain } from '@adguard/ecss-tree';

import { defineRule, LinterRuleType } from '../linter/rule';
import { validateDeclaration } from '../utils/css-utils/css-validator';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-css-declaration',
            description: 'Checks if CSS declarations are valid',
            recommended: true,
        },
    },
    create: (context) => {
        return {
            Declaration: (node: DeclarationPlain) => {
                validateDeclaration(node).forEach((error) => {
                    const position = context.sourceCode.getLinterPositionRangeFromOffsetRange([
                        node.loc!.start.offset + error.start!,
                        node.loc!.start.offset + error.end!,
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
