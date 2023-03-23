/**
 * @file Additional / helper functions for ECSSTree / CSSTree.
 */

import {
    parse,
    walk,
    AttributeSelector,
    SyntaxParseError,
    CssNode,
    PseudoClassSelector,
    Selector,
    generate,
    CssNodePlain,
    toPlainObject,
    SelectorList,
    DeclarationList,
    MediaQueryList,
    MediaQuery,
} from '@adguard/ecss-tree';
import { EXTCSS_PSEUDO_CLASSES, EXTCSS_ATTRIBUTES } from '../converter/pseudo';
import {
    ASSIGN_OPERATOR,
    CLOSE_PARENTHESIS,
    CLOSE_SQUARE_BRACKET,
    COLON,
    COMMA,
    CSS_IMPORTANT,
    DOT,
    EMPTY,
    HASHMARK,
    OPEN_PARENTHESIS,
    OPEN_SQUARE_BRACKET,
    SEMICOLON,
    SPACE,
} from './constants';
import { CssTreeNodeType, CssTreeParserContext } from './csstree-constants';
import { AdblockSyntaxError } from '../parser/errors/syntax-error';
import { defaultLocation } from '../parser/nodes';
import { locRange } from './location';

/**
 * Common CSSTree parsing options.
 */
const commonCssTreeOptions = {
    parseAtrulePrelude: true,
    parseRulePrelude: true,
    parseValue: true,
    parseCustomProperty: true,
    positions: true,
};

/**
 * Result interface for ExtendedCSS finder.
 */
export interface ExtendedCssNodes {
    /**
     * ExtendedCSS pseudo classes.
     */
    pseudos: PseudoClassSelector[];

    /**
     * ExtendedCSS attributes.
     */
    attributes: AttributeSelector[];
}

/**
 * Additional / helper functions for CSSTree.
 */
export class CssTree {
    /**
     * Helper function for parsing CSS parts.
     *
     * @param raw Raw CSS input
     * @param context CSSTree context
     * @param loc Base location for the parsed node
     * @returns CSSTree node (AST)
     */
    public static parse(raw: string, context: CssTreeParserContext, loc = defaultLocation): CssNode {
        try {
            return parse(raw, {
                context,
                ...commonCssTreeOptions,
                ...loc,
                // https://github.com/csstree/csstree/blob/master/docs/parsing.md#onparseerror
                onParseError: (error: SyntaxParseError) => {
                    throw new AdblockSyntaxError(
                        // eslint-disable-next-line max-len
                        `ECSSTree parsing error: '${error.rawMessage || error.message}'`,
                        locRange(loc, error.offset, raw.length),
                    );
                },
                // TODO: False positive alert for :xpath('//*[contains(text(),"a")]')
                // // We don't need CSS comments
                // onComment: (value: string, commentLoc: CssLocation) => {
                //     throw new AdblockSyntaxError(
                //         'ECSSTree parsing error: \'Unexpected comment\'',
                //         locRange(loc, commentLoc.start.offset, commentLoc.end.offset),
                //     );
                // },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new AdblockSyntaxError(
                    // eslint-disable-next-line max-len
                    `ECSSTree parsing error: '${error.message}'`,
                    locRange(loc, 0, raw.length),
                );
            }

            // Pass through
            throw error;
        }
    }

    /**
     * Helper function for parsing CSS parts. This function is tolerates CSSTree fallbacks
     * (for example, fallback to Raw node if it can't parse the input).
     *
     * @param raw Raw CSS input
     * @param context CSSTree context
     * @param loc Base location for the parsed node
     * @returns CSSTree node (AST)
     */
    public static parseTolerant(raw: string, context: CssTreeParserContext, loc = defaultLocation): CssNode {
        try {
            return parse(raw, {
                context,
                ...commonCssTreeOptions,
                ...loc,
                // TODO: False positive alert for :xpath('//*[contains(text(),"a")]')
                // // We don't need CSS comments
                // onComment: (value: string, commentLoc: CssLocation) => {
                //     throw new AdblockSyntaxError(
                //         'ECSSTree parsing error: \'Unexpected comment\'',
                //         locRange(loc, commentLoc.start.offset, commentLoc.end.offset),
                //     );
                // },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new AdblockSyntaxError(
                    // eslint-disable-next-line max-len
                    `ECSSTree parsing error: '${error.message}'`,
                    locRange(loc, 0, raw.length),
                );
            }

            // Pass through
            throw error;
        }
    }

    /**
     * Helper function for parsing CSS parts.
     *
     * @param raw Raw CSS input
     * @param context CSSTree context
     * @param loc Base location for the parsed node
     * @returns CSSTree node (AST)
     */
    public static parsePlain(raw: string, context: CssTreeParserContext, loc = defaultLocation): CssNodePlain {
        try {
            return toPlainObject(
                parse(raw, {
                    context,
                    ...commonCssTreeOptions,
                    ...loc,
                    // https://github.com/csstree/csstree/blob/master/docs/parsing.md#onparseerror
                    onParseError: (error: SyntaxParseError) => {
                        throw new AdblockSyntaxError(
                            // eslint-disable-next-line max-len
                            `ECSSTree parsing error: '${error.rawMessage || error.message}'`,
                            locRange(loc, error.offset, raw.length),
                        );
                    },
                    // TODO: False positive alert for :xpath('//*[contains(text(),"a")]')
                    // We don't need CSS comments
                    // onComment: (value: string, commentLoc: CssLocation) => {
                    //     throw new AdblockSyntaxError(
                    //         'ECSSTree parsing error: \'Unexpected comment\'',
                    //         locRange(loc, commentLoc.start.offset, commentLoc.end.offset),
                    //     );
                    // },
                }),
            );
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new AdblockSyntaxError(
                    // eslint-disable-next-line max-len
                    `ECSSTree parsing error: '${error.message}'`,
                    locRange(loc, 0, raw.length),
                );
            }

            // Pass through
            throw error;
        }
    }

    /**
     * Helper function for creating attribute selectors.
     *
     * @param attribute Attribute name
     * @param value Attribute value
     * @returns Attribute selector AST
     */
    public static createAttributeSelector(attribute: string, value: string): AttributeSelector {
        return {
            type: CssTreeNodeType.AttributeSelector,
            name: {
                type: CssTreeNodeType.Identifier,
                name: attribute,
            },
            matcher: ASSIGN_OPERATOR,
            value: {
                type: CssTreeNodeType.String,
                value,
            },
            flags: null,
        };
    }

    /**
     *
     * @param selectorAst - CSSTree Selector AST
     * @returns Extended CSS Nodes
     */
    public static getSelectorExtendedCssNodes(selectorAst: Selector): ExtendedCssNodes {
        const pseudos: PseudoClassSelector[] = [];
        const attributes: AttributeSelector[] = [];

        walk(selectorAst, (node: CssNode) => {
            // Pseudo classes
            if (node.type === CssTreeNodeType.PseudoClassSelector) {
                // ExtCSS pseudo classes
                if (EXTCSS_PSEUDO_CLASSES.includes(node.name)) {
                    pseudos.push(node);
                }
            } else if (node.type === CssTreeNodeType.AttributeSelector) {
                // Attribute selectors
                if (EXTCSS_ATTRIBUTES.includes(node.name.name)) {
                    attributes.push(node);
                }
            }
        });

        return {
            pseudos,
            attributes,
        };
    }

    /**
     * Generates string representation of the media query list.
     *
     * @param ast Media query list AST
     * @returns String representation of the media query list
     */
    public static generateMediaQueryList(ast: MediaQueryList): string {
        let result = EMPTY;

        if (!ast.children || ast.children.size === 0) {
            throw new Error('Media query list cannot be empty');
        }

        ast.children.forEach((mediaQuery: CssNode, listItem) => {
            if (mediaQuery.type !== CssTreeNodeType.MediaQuery) {
                throw new Error(`Unexpected node type: ${mediaQuery.type}`);
            }

            result += this.generateMediaQuery(mediaQuery);

            if (listItem.next !== null) {
                result += COMMA;
                result += SPACE;
            }
        });

        return result;
    }

    /**
     * Generates string representation of the media query.
     *
     * @param ast Media query AST
     * @returns String representation of the media query
     */
    public static generateMediaQuery(ast: MediaQuery): string {
        let result = EMPTY;

        if (!ast.children || ast.children.size === 0) {
            throw new Error('Media query cannot be empty');
        }

        ast.children.forEach((node: CssNode, listItem) => {
            if (node.type === CssTreeNodeType.MediaFeature) {
                result += OPEN_PARENTHESIS;
                result += node.name;

                if (node.value !== null) {
                    result += COLON;
                    result += SPACE;
                    // Use default generator for media feature value
                    result += generate(node.value);
                }

                result += CLOSE_PARENTHESIS;
            } else if (node.type === CssTreeNodeType.Identifier) {
                result += node.name;
            } else {
                throw new Error(`Unexpected node type: ${node.type}`);
            }

            if (listItem.next !== null) {
                result += SPACE;
            }
        });

        return result;
    }

    /**
     * Generates string representation of the selector list.
     *
     * @param ast SelectorList AST
     * @returns String representation of the selector list
     */
    public static generateSelectorList(ast: SelectorList): string {
        let result = EMPTY;

        if (!ast.children || ast.children.size === 0) {
            throw new Error('Selector list cannot be empty');
        }

        ast.children.forEach((selector: CssNode, listItem) => {
            if (selector.type !== CssTreeNodeType.Selector) {
                throw new Error(`Unexpected node type: ${selector.type}`);
            }

            result += this.generateSelector(selector);

            if (listItem.next !== null) {
                result += COMMA;
                result += SPACE;
            }
        });

        return result;
    }

    /**
     * Selector generation based on CSSTree's AST. This is necessary because CSSTree
     * only adds spaces in some edge cases.
     *
     * @param ast CSS Tree AST
     * @returns CSS selector as string
     */
    public static generateSelector(ast: Selector): string {
        let result = EMPTY;

        let inAttributeSelector = false;
        let depth = 0;
        let selectorListDepth = -1;
        let prevNode: CssNode = ast;

        walk(ast, {
            enter: (node: CssNode) => {
                depth += 1;

                // Skip attribute selector / selector list children
                if (inAttributeSelector || selectorListDepth > -1) {
                    return;
                }

                switch (node.type) {
                    // "Trivial" nodes
                    case CssTreeNodeType.TypeSelector:
                        result += node.name;
                        break;

                    case CssTreeNodeType.ClassSelector:
                        result += DOT;
                        result += node.name;
                        break;

                    case CssTreeNodeType.IdSelector:
                        result += HASHMARK;
                        result += node.name;
                        break;

                    case CssTreeNodeType.Identifier:
                        result += node.name;
                        break;

                    case CssTreeNodeType.Raw:
                        result += node.value;
                        break;

                    // "Advanced" nodes
                    case CssTreeNodeType.Nth:
                        // Default generation enough
                        result += generate(node);
                        break;

                    // For example :not([id], [name])
                    case CssTreeNodeType.SelectorList:
                        // eslint-disable-next-line no-case-declarations
                        const selectors: string[] = [];

                        node.children.forEach((selector) => {
                            if (selector.type === CssTreeNodeType.Selector) {
                                selectors.push(CssTree.generateSelector(selector));
                            } else if (selector.type === CssTreeNodeType.Raw) {
                                selectors.push(selector.value);
                            }
                        });

                        // Join selector lists
                        result += selectors.join(COMMA + SPACE);

                        // Skip nodes here
                        selectorListDepth = depth;
                        break;

                    case CssTreeNodeType.Combinator:
                        if (node.name === SPACE) {
                            result += node.name;
                            break;
                        }

                        // Prevent this case (unnecessary space): has( > .something)
                        if (prevNode.type !== CssTreeNodeType.Selector) {
                            result += SPACE;
                        }

                        result += node.name;
                        result += SPACE;
                        break;

                    case CssTreeNodeType.AttributeSelector:
                        result += OPEN_SQUARE_BRACKET;

                        // Identifier name
                        if (node.name) {
                            result += node.name.name;
                        }

                        // Matcher operator, eg =
                        if (node.matcher) {
                            result += node.matcher;

                            // Value can be String, Identifier or null
                            if (node.value !== null) {
                                // String node
                                if (node.value.type === CssTreeNodeType.String) {
                                    result += generate(node.value);
                                } else if (node.value.type === CssTreeNodeType.Identifier) {
                                    // Identifier node
                                    result += node.value.name;
                                }
                            }
                        }

                        // Flags
                        if (node.flags) {
                            // Space before flags
                            result += SPACE;
                            result += node.flags;
                        }

                        result += CLOSE_SQUARE_BRACKET;

                        inAttributeSelector = true;
                        break;

                    case CssTreeNodeType.PseudoElementSelector:
                        result += COLON;
                        result += COLON;
                        result += node.name;

                        if (node.children !== null) {
                            result += OPEN_PARENTHESIS;
                        }

                        break;

                    case CssTreeNodeType.PseudoClassSelector:
                        result += COLON;
                        result += node.name;

                        if (node.children !== null) {
                            result += OPEN_PARENTHESIS;
                        }
                        break;

                    default:
                        break;
                }

                prevNode = node;
            },
            leave: (node: CssNode) => {
                depth -= 1;

                if (node.type === CssTreeNodeType.SelectorList && depth + 1 === selectorListDepth) {
                    selectorListDepth = -1;
                }

                if (selectorListDepth > -1) {
                    return;
                }

                if (node.type === CssTreeNodeType.AttributeSelector) {
                    inAttributeSelector = false;
                }

                if (inAttributeSelector) {
                    return;
                }

                switch (node.type) {
                    case CssTreeNodeType.PseudoElementSelector:
                    case CssTreeNodeType.PseudoClassSelector:
                        if (node.children !== null) {
                            result += CLOSE_PARENTHESIS;
                        }
                        break;

                    default:
                        break;
                }
            },
        });

        return result.trim();
    }

    /**
     * Block generation based on CSSTree's AST. This is necessary because CSSTree only adds spaces in some edge cases.
     *
     * @param ast CSS Tree AST
     * @returns CSS selector as string
     */
    public static generateDeclarationList(ast: DeclarationList): string {
        let result = EMPTY;

        walk(ast, {
            enter: (node: CssNode) => {
                switch (node.type) {
                    case CssTreeNodeType.Declaration: {
                        result += node.property;

                        if (node.value) {
                            result += COLON;
                            result += SPACE;

                            // Fallback to CSSTree's default generate function for the value (enough at this point)
                            result += generate(node.value);
                        }

                        if (node.important) {
                            result += SPACE;
                            result += CSS_IMPORTANT;
                        }

                        break;
                    }

                    default:
                        break;
                }
            },
            leave: (node: CssNode) => {
                switch (node.type) {
                    case CssTreeNodeType.Declaration: {
                        result += SEMICOLON;
                        result += SPACE;
                        break;
                    }

                    default:
                        break;
                }
            },
        });

        return result.trim();
    }
}
