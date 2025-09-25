/**
 * Migrated from https://github.com/AdguardTeam/tsurlfilter/blob/2144959e92f94e4738274ce577c2fe26e3a0c08b/packages/agtree/src/utils/csstree.ts.
 *
 * We implement our custom generate logic for some CSS nodes because CSSTree's default
 * generator does not add spaces, just in some edge cases, but we want to show some formatted code.
 */

import {
    type CssNode,
    type DeclarationList,
    type FunctionNode,
    generate,
    type MediaQuery,
    type MediaQueryList,
    type PseudoClassSelector,
    type Selector,
    type SelectorList,
    walk,
} from '@adguard/ecss-tree';

import {
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
} from '../../common/constants';

import { CssTreeNodeType } from './css-tree-types';

/**
 * Generates string representation of the media query.
 *
 * @param mediaQueryNode Media query AST.
 *
 * @returns String representation of the media query.
 */
export const generateMediaQuery = (mediaQueryNode: MediaQuery): string => {
    let result = EMPTY;

    if (!mediaQueryNode.children || mediaQueryNode.children.size === 0) {
        throw new Error('Media query cannot be empty');
    }

    mediaQueryNode.children.forEach((node: CssNode, listItem) => {
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
};

/**
 * Generates string representation of the media query list.
 *
 * @param mediaQueryListNode Media query list AST.
 *
 * @returns String representation of the media query list.
 */
export const generateMediaQueryList = (mediaQueryListNode: MediaQueryList): string => {
    let result = EMPTY;

    if (!mediaQueryListNode.children || mediaQueryListNode.children.size === 0) {
        throw new Error('Media query list cannot be empty');
    }

    mediaQueryListNode.children.forEach((mediaQuery: CssNode, listItem) => {
        if (mediaQuery.type !== CssTreeNodeType.MediaQuery) {
            throw new Error(`Unexpected node type: ${mediaQuery.type}`);
        }

        result += generateMediaQuery(mediaQuery);

        if (listItem.next !== null) {
            result += COMMA;
            result += SPACE;
        }
    });

    return result;
};

/**
 * Selector generation based on CSSTree's AST. This is necessary because CSSTree
 * only adds spaces in some edge cases.
 *
 * @param selectorNode CSS Tree AST.
 *
 * @returns CSS selector as string.
 */
export const generateSelector = (selectorNode: Selector): string => {
    let result = EMPTY;

    let inAttributeSelector = false;
    let depth = 0;
    let selectorListDepth = -1;
    let prevNode: CssNode = selectorNode;

    walk(selectorNode, {
        enter: (node: CssNode) => {
            depth += 1;

            // Skip attribute selector or selector list children
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
                            selectors.push(generateSelector(selector));
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
};

/**
 * Generates string representation of the selector list.
 *
 * @param selectorListNode SelectorList AST.
 *
 * @returns String representation of the selector list.
 */
export const generateSelectorList = (selectorListNode: SelectorList): string => {
    let result = EMPTY;

    if (!selectorListNode.children || selectorListNode.children.size === 0) {
        throw new Error('Selector list cannot be empty');
    }

    selectorListNode.children.forEach((selector: CssNode, listItem) => {
        if (selector.type !== CssTreeNodeType.Selector) {
            throw new Error(`Unexpected node type: ${selector.type}`);
        }

        result += generateSelector(selector);

        if (listItem.next !== null) {
            result += COMMA;
            result += SPACE;
        }
    });

    return result;
};

/**
 * Block generation based on CSSTree's AST. This is necessary because CSSTree only adds spaces in some edge cases.
 *
 * @param declarationListNode CSS Tree AST.
 *
 * @returns CSS selector as string.
 */
export const generateDeclarationList = (declarationListNode: DeclarationList): string => {
    let result = EMPTY;

    walk(declarationListNode, {
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
};

/**
 * Helper function to generate a raw string from a pseudo-class
 * selector's children.
 *
 * @param node Pseudo-class selector node.
 *
 * @returns Generated pseudo-class value.
 *
 * @example
 * - `:nth-child(2n+1)` -> `2n+1`
 * - `:matches-path(/foo/bar)` -> `/foo/bar`
 */
export const generatePseudoClassValue = (node: PseudoClassSelector): string => {
    let result = EMPTY;

    node.children?.forEach((child) => {
        switch (child.type) {
            case CssTreeNodeType.Selector:
                result += generateSelector(child);
                break;

            case CssTreeNodeType.SelectorList:
                result += generateSelectorList(child);
                break;

            case CssTreeNodeType.Raw:
                result += child.value;
                break;

            default:
                // Fallback to CSSTree's default generate function
                result += generate(child);
        }
    });

    return result;
};

/**
 * Helper function to generate a raw string from a function selector's children.
 *
 * @param node Function node.
 *
 * @returns Generated function value.
 *
 * @example `responseheader(name)` -> `name`
 */
export const generateFunctionValue = (node: FunctionNode): string => {
    let result = EMPTY;

    node.children?.forEach((child) => {
        switch (child.type) {
            case CssTreeNodeType.Raw:
                result += child.value;
                break;

            default:
                // Fallback to CSSTree's default generate function
                result += generate(child);
        }
    });

    return result;
};
