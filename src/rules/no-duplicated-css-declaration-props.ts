import { type CssNode, type DeclarationPlain, generate } from '@adguard/ecss-tree';

import {
    CLOSE_CURLY_BRACKET,
    CR,
    EMPTY,
    LF,
    SEMICOLON,
    SPACE,
    TAB,
} from '../common/constants';
import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

/**
 * Checks if a character is whitespace.
 *
 * @param char The character to check.
 *
 * @returns True if the character is whitespace, false otherwise.
 */
const isWhitespace = (char: string): boolean => {
    return char === SPACE || char === TAB || char === LF || char === CR;
};

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-css-declaration-props',
            description: 'Checks for duplicated CSS declaration properties within the same rule block',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-duplicated-css-declaration-props'),
        },
        messages: {
            duplicatedProperty: 'Duplicated CSS property "{{property}}"',
            removeFirstDeclaration: 'Remove first "{{property}}" declaration (value: {{value}})',
            removeCurrentDeclaration: 'Remove current "{{property}}" declaration (value: {{value}})',
        },
        hasFix: true,
        hasSuggestions: true,
        correctExamples: [
            {
                name: 'No duplicated CSS properties',
                code: [
                    '#$#body { color: red; }',
                    '#$#body { padding: 10px; }',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Invalid CSS declarations (same property, same values)',
                code: [
                    '#$#body { color: red; color: red; }',
                ].join('\n'),
            },
            {
                name: 'Invalid CSS declarations (same property, different values)',
                code: [
                    '#$#body { color: red; color: blue; }',
                ].join('\n'),
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        const declarationHistory: Map<string, DeclarationPlain[]> = new Map();

        const handleDeclaration = (node: DeclarationPlain) => {
            const property = node.property.toLowerCase();

            if (!declarationHistory.has(property)) {
                declarationHistory.set(property, []);
            }

            const existingDeclarations = declarationHistory.get(property)!;

            if (existingDeclarations.length > 0) {
                // This is a duplicate property
                const firstDeclaration = existingDeclarations[0];

                const hasSameValue = firstDeclaration?.value && node.value
                    && generate(firstDeclaration.value as CssNode).trim() === generate(node.value as CssNode).trim();

                const reportData = {
                    messageId: 'duplicatedProperty' as const,
                    data: {
                        property: node.property,
                    },
                    node,
                };

                const createRemovalFix = (targetNode: DeclarationPlain) => {
                    return (fixer: any) => {
                        const nodeRange = context.getOffsetRangeForNode(targetNode);
                        if (!nodeRange) {
                            return null;
                        }

                        let [startOffset, endOffset] = nodeRange;
                        const sourceText = context.sourceCode.getText();

                        if (endOffset < sourceText.length && sourceText[endOffset] === SEMICOLON) {
                            endOffset += 1;
                        }

                        while (endOffset < sourceText.length) {
                            const char = sourceText[endOffset];
                            if (char && isWhitespace(char)) {
                                endOffset += 1;
                            } else {
                                break;
                            }
                        }

                        // Find leading whitespace
                        while (startOffset > 0) {
                            const char = sourceText[startOffset - 1];
                            if (char && isWhitespace(char)) {
                                startOffset -= 1;
                            } else {
                                break;
                            }
                        }

                        let replacement = EMPTY;
                        if (endOffset < sourceText.length) {
                            const nextChar = sourceText[endOffset];
                            if (nextChar === CLOSE_CURLY_BRACKET) {
                                replacement = SPACE;
                            }
                        }

                        return fixer.replaceWithText([startOffset, endOffset], replacement);
                    };
                };

                if (hasSameValue) {
                    // Auto-fix when values are identical
                    context.report({
                        ...reportData,
                        fix: createRemovalFix(node),
                    });
                } else {
                    // Provide suggestions when values are different
                    const firstValue = firstDeclaration?.value
                        ? generate(firstDeclaration.value as CssNode).trim() : '';
                    const currentValue = node.value ? generate(node.value as CssNode).trim() : '';

                    const suggestions = [];

                    // Add suggestion to remove first declaration
                    if (firstDeclaration) {
                        suggestions.push({
                            messageId: 'removeFirstDeclaration' as const,
                            data: {
                                property: node.property,
                                value: firstValue,
                            },
                            fix: createRemovalFix(firstDeclaration),
                        });
                    }

                    // Add suggestion to remove current declaration
                    suggestions.push({
                        messageId: 'removeCurrentDeclaration' as const,
                        data: {
                            property: node.property,
                            value: currentValue,
                        },
                        fix: createRemovalFix(node),
                    });

                    context.report({
                        ...reportData,
                        suggest: suggestions,
                    });
                }
            }

            existingDeclarations.push(node);
        };

        return {
            'DeclarationList:exit': () => {
                declarationHistory.clear();
            },
            Declaration: handleDeclaration,
        };
    },
});
