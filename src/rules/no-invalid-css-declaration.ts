import { type DeclarationPlain } from '@adguard/ecss-tree';

import { validateDeclaration } from '../linter/helpers/css-validator';
import { defineRule, LinterRuleType } from '../linter-new/rule';

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
                    context.report({
                        message: error.message,
                        position: context.sourceCode.getLinterPositionRangeFromOffsetRange([
                            node.loc!.start.offset + error.start!,
                            node.loc!.start.offset + error.end!,
                        ])!,
                    });
                });
            },
        };
    },
});
