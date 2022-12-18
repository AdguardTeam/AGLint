/**
 * Additional / helper functions for CSSTree.
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
    Block,
    CssNodePlain,
    toPlainObject,
} from "css-tree";
import { EXTCSS_PSEUDO_CLASSES, EXTCSS_ATTRIBUTES } from "../converter/pseudo";
import {
    COMMA,
    CSS_ATTRIBUTE_SELECTOR_CLOSE,
    CSS_ATTRIBUTE_SELECTOR_OPEN,
    CSS_CLASS_MARKER,
    CSS_DECLARATION_END,
    CSS_DECLARATION_SEPARATOR,
    CSS_ID_MARKER,
    CSS_IMPORTANT,
    CSS_PSEUDO_CLOSE,
    CSS_PSEUDO_MARKER,
    CSS_PSEUDO_OPEN,
    EMPTY,
    SPACE,
} from "./constants";
import { CssTreeNodeType, CssTreeParserContext } from "./csstree-constants";

export interface ExtendedCssNodes {
    pseudos: PseudoClassSelector[];
    attributes: AttributeSelector[];
}

export class CssTree {
    /**
     * Helper function for parsing CSS parts.
     *
     * @param raw - Raw CSS input
     * @param context - CSSTree context
     * @returns CSSTree node (AST)
     */
    public static parse(raw: string, context: CssTreeParserContext): CssNode {
        return parse(raw, {
            context,
            parseAtrulePrelude: true,
            parseRulePrelude: true,
            parseValue: true,
            parseCustomProperty: true,
            onParseError: (error: SyntaxParseError /*, fallbackNode: CssNode*/) => {
                throw new SyntaxError(error.rawMessage);
            },
        });
    }

    /**
     * Helper function for parsing CSS parts.
     *
     * @param raw - Raw CSS input
     * @param context - CSSTree context
     * @returns CSSTree node (AST)
     */
    public static parsePlain(raw: string, context: CssTreeParserContext): CssNodePlain {
        return toPlainObject(
            parse(raw, {
                context,
                parseAtrulePrelude: true,
                parseRulePrelude: true,
                parseValue: true,
                parseCustomProperty: true,
                onParseError: (error: SyntaxParseError /*, fallbackNode: CssNode*/) => {
                    throw new SyntaxError(error.rawMessage);
                },
            })
        );
    }

    /**
     * Helper function for creating attribute selectors.
     *
     * @param attribute - Attribute name
     * @param value - Attribute value
     * @returns Attribute selector AST
     */
    public static createAttributeSelector(attribute: string, value: string): AttributeSelector {
        return {
            type: CssTreeNodeType.AttributeSelector,
            name: {
                type: CssTreeNodeType.Identifier,
                name: attribute,
            },
            matcher: "=",
            value: {
                type: CssTreeNodeType.String,
                value: value,
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
            }
            // Attribute selectors
            else if (node.type === CssTreeNodeType.AttributeSelector) {
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
     * Selector generation based on CSSTree's AST. This is necessary because CSSTree
     * only adds spaces in some edge cases.
     *
     * @param ast - CSS Tree AST
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
                depth++;

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
                        result += CSS_CLASS_MARKER;
                        result += node.name;
                        break;

                    case CssTreeNodeType.IdSelector:
                        result += CSS_ID_MARKER;
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
                        result += generate(node);
                        break;

                    // For example :not([id], [name])
                    case CssTreeNodeType.SelectorList:
                        // eslint-disable-next-line no-case-declarations
                        const selectors: string[] = [];

                        node.children.forEach((selector) => {
                            // Selector
                            if (selector.type == CssTreeNodeType.Selector) {
                                selectors.push(CssTree.generateSelector(selector));
                            }
                            // Raw (theoretically, CSSTree only parses selectors in this case)
                            // else if (selector.type == CssTreeNodeType.Raw) {
                            //     selectors.push(selector.value);
                            // }
                        });

                        // Join selector lists
                        result += selectors.join(COMMA + SPACE);

                        // Skip nodes here
                        selectorListDepth = depth;
                        break;

                    case CssTreeNodeType.Combinator:
                        if (node.name == SPACE) {
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
                        result += CSS_ATTRIBUTE_SELECTOR_OPEN;

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
                                if (node.value.type == CssTreeNodeType.String) {
                                    result += generate(node.value);
                                }
                                // Identifier node
                                else if (node.value.type == CssTreeNodeType.Identifier) {
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

                        result += CSS_ATTRIBUTE_SELECTOR_CLOSE;

                        inAttributeSelector = true;
                        break;

                    case CssTreeNodeType.PseudoElementSelector:
                        result += CSS_PSEUDO_MARKER;
                        result += CSS_PSEUDO_MARKER;
                        result += node.name;

                        if (node.children !== null) {
                            result += CSS_PSEUDO_OPEN;
                        }

                        break;

                    case CssTreeNodeType.PseudoClassSelector:
                        result += CSS_PSEUDO_MARKER;
                        result += node.name;

                        if (node.children !== null) {
                            result += CSS_PSEUDO_OPEN;
                        }
                        break;
                }

                prevNode = node;
            },
            leave: (node: CssNode) => {
                depth--;

                if (node.type == CssTreeNodeType.SelectorList && depth + 1 == selectorListDepth) {
                    selectorListDepth = -1;
                }

                if (selectorListDepth > -1) {
                    return;
                }

                if (node.type == CssTreeNodeType.AttributeSelector) {
                    inAttributeSelector = false;
                }

                if (inAttributeSelector) {
                    return;
                }

                switch (node.type) {
                    case CssTreeNodeType.PseudoElementSelector:
                    case CssTreeNodeType.PseudoClassSelector:
                        if (node.children !== null) {
                            result += CSS_PSEUDO_CLOSE;
                        }
                        break;
                }
            },
        });

        return result.trim();
    }

    /**
     * Block generation based on CSSTree's AST. This is necessary because CSSTree only adds spaces in some edge cases.
     *
     * @param ast - CSS Tree AST
     * @returns CSS selector as string
     */
    public static generateBlock(ast: Block): string {
        let result = EMPTY;

        walk(ast, {
            enter: (node: CssNode) => {
                switch (node.type) {
                    case CssTreeNodeType.Declaration: {
                        result += node.property;

                        if (node.value) {
                            result += CSS_DECLARATION_SEPARATOR;
                            result += SPACE;

                            // Fallback to CSSTree's default generate function for the value (enough at this point)
                            result += generate(node.value);
                        }

                        if (node.important) {
                            // FIXME: Space before important?
                            // See https://github.com/AdguardTeam/AdguardFilters/pull/132240#discussion_r996684483
                            result += SPACE;
                            result += CSS_IMPORTANT;
                        }

                        break;
                    }
                }
            },
            leave: (node: CssNode) => {
                switch (node.type) {
                    case CssTreeNodeType.Declaration: {
                        result += CSS_DECLARATION_END;
                        result += SPACE;
                        break;
                    }
                }
            },
        });

        return result.trim();
    }
}
