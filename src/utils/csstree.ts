/**
 * Additional / helper functions for CSSTree
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
} from "css-tree";
import { EXTCSS_PSEUDO_CLASSES, EXTCSS_ATTRIBUTES } from "../converter/pseudo";
import {
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
    SPACE,
} from "./constants";

export interface IExtendedCssNodes {
    pseudos: PseudoClassSelector[];
    attributes: AttributeSelector[];
}

export class CssTree {
    /**
     * Helper function for parsing CSS parts.
     *
     * @param {string} raw - Raw CSS input
     * @param {string} context - CSSTree context
     * @see {@link https://github.com/csstree/csstree/blob/master/docs/parsing.md#context}
     * @returns {CssNode} - CSSTree node (AST)
     */
    public static parse(raw: string, context: string): CssNode {
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
     * Helper function for creating attribute selectors.
     *
     * @param {string} attribute - Attribute name
     * @param {string} value - Attribute value
     * @returns {AttributeSelector} - Attribute selector AST
     */
    public static createAttributeSelector(attribute: string, value: string): AttributeSelector {
        return {
            type: "AttributeSelector",
            name: {
                type: "Identifier",
                name: attribute,
            },
            matcher: "=",
            value: {
                type: "String",
                value: value,
            },
            flags: null,
        };
    }

    /**
     *
     * @param {Selector} selectorAst - CSSTree Selector AST
     * @returns {IExtendedCssNodes} Extended CSS Nodes
     */
    public static getSelectorExtendedCssNodes(selectorAst: Selector): IExtendedCssNodes {
        const pseudos: PseudoClassSelector[] = [];
        const attributes: AttributeSelector[] = [];

        walk(selectorAst, (node: CssNode) => {
            // Pseudo classes
            if (node.type === "PseudoClassSelector") {
                // ExtCSS pseudo classes
                if (EXTCSS_PSEUDO_CLASSES.includes(node.name)) {
                    pseudos.push(node);
                }
            }
            // Attribute selectors
            else if (node.type === "AttributeSelector") {
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
     * @param {CssNode} ast - CSS Tree AST
     * @returns {string} CSS selector as string
     */
    public static generateSelector(ast: Selector): string {
        let result = "";

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
                    case "TypeSelector":
                        result += node.name;
                        break;

                    case "ClassSelector":
                        result += CSS_CLASS_MARKER;
                        result += node.name;
                        break;

                    case "IdSelector":
                        result += CSS_ID_MARKER;
                        result += node.name;
                        break;

                    case "Identifier":
                        result += SPACE;
                        result += node.name;
                        result += SPACE;
                        break;

                    case "Raw":
                        result += node.value;
                        break;

                    // "Advanced" nodes
                    case "Nth":
                        result += generate(node);
                        break;

                    // For example :not([id], [name])
                    case "SelectorList":
                        // eslint-disable-next-line no-case-declarations
                        const selectors: string[] = [];

                        node.children.forEach((selector) => {
                            // Selector
                            if (selector.type == "Selector") {
                                selectors.push(CssTree.generateSelector(selector));
                            }
                            // Raw
                            else if (selector.type == "Raw") {
                                selectors.push(selector.value);
                            }
                        });

                        // Join selector lists
                        result += selectors.join(", ");

                        // Skip nodes here
                        selectorListDepth = depth;
                        break;

                    case "Combinator":
                        if (node.name == SPACE) {
                            result += node.name;
                            break;
                        }

                        // Prevent this case (unnecessary space): has( > .something)
                        if (prevNode.type !== "Selector") {
                            result += SPACE;
                        }

                        result += node.name;
                        result += SPACE;
                        break;

                    case "AttributeSelector":
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
                                if (node.value.type == "String") {
                                    result += generate(node.value);
                                }
                                // Identifier node
                                else if (node.value.type == "Identifier") {
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

                    case "PseudoElementSelector":
                        result += CSS_PSEUDO_MARKER;
                        result += CSS_PSEUDO_MARKER;
                        result += node.name;

                        if (node.children !== null) {
                            result += CSS_PSEUDO_OPEN;
                        }

                        break;

                    case "PseudoClassSelector":
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

                if (node.type == "SelectorList" && depth + 1 == selectorListDepth) {
                    selectorListDepth = -1;
                }

                if (selectorListDepth > -1) {
                    return;
                }

                if (node.type == "AttributeSelector") {
                    inAttributeSelector = false;
                }

                if (inAttributeSelector) {
                    return;
                }

                switch (node.type) {
                    case "PseudoElementSelector":
                    case "PseudoClassSelector":
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
     * @param {CssNode} ast - CSS Tree AST
     * @returns {string} CSS selector as string
     */
    public static generateBlock(ast: Block): string {
        let result = "";

        walk(ast, {
            enter: (node: CssNode) => {
                switch (node.type) {
                    case "Declaration": {
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
                    case "Declaration": {
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
