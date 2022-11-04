/**
 * Elementhiding rule body parser
 */

import { Selector, SelectorList } from "css-tree";
import { SPACE } from "../../../utils/constants";
import { CssTree } from "../../../utils/csstree";
import { CssTreeNodeType, CssTreeParserContext } from "../../../utils/csstree-constants";
import { StringUtils } from "../../../utils/string";

const CSS_SELECTORS_SEPARATOR = ",";

export interface IElementHidingRuleBody {
    selectors: Selector[];
}

export class ElementHidingBodyParser {
    /**
     * Parses a raw cosmetic rule body as an element hiding rule body.
     *
     * @param {string} raw - Raw body
     * @returns {IElementHidingRuleBody | null} Element hiding rule body AST
     * @throws
     *   - If the selector is invalid according to the CSS syntax
     */
    public static parse(raw: string): IElementHidingRuleBody {
        const trimmed = raw.trim();

        const selectors: Selector[] = [];

        // Selector
        if (StringUtils.findNextUnescapedCharacter(trimmed, CSS_SELECTORS_SEPARATOR) == -1) {
            selectors.push(<Selector>CssTree.parse(trimmed, CssTreeParserContext.selector));
        }

        // SelectorList
        else {
            const selectorListAst = <SelectorList>CssTree.parse(trimmed, CssTreeParserContext.selectorList);
            selectorListAst.children.forEach((child) => {
                if (child.type === CssTreeNodeType.Selector) {
                    selectors.push(child);
                }
            });
        }

        return {
            selectors,
        };
    }

    /**
     * Converts an element hiding rule body AST to a string.
     *
     * @param {IElementHidingRuleBody} ast - Element hiding rule body AST
     * @returns {string} Raw string
     */
    public static generate(ast: IElementHidingRuleBody): string {
        return ast.selectors
            .map((selector) => CssTree.generateSelector(selector))
            .join(CSS_SELECTORS_SEPARATOR + SPACE);
    }
}
