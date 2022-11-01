/**
 * Elementhiding rule body parser
 */

import { Selector, SelectorList } from "css-tree";
import { CssTree } from "../../../utils/csstree";
import { StringUtils } from "../../../utils/string";

const CSS_SELECTORS_SEPARATOR = ",";

export interface IElementHidingRuleBody {
    selectors: Selector[];
}

export class ElementHidingBodyParser {
    public static parse(rawBody: string): IElementHidingRuleBody {
        const selectors: Selector[] = [];

        // Selector
        if (StringUtils.findNextUnescapedCharacter(rawBody, CSS_SELECTORS_SEPARATOR) == -1) {
            selectors.push(<Selector>CssTree.parse(rawBody, "selector"));
        }

        // SelectorList
        else {
            const selectorListAst = <SelectorList>CssTree.parse(rawBody, "selectorList");
            selectorListAst.children.forEach((child) => {
                if (child.type === "Selector") {
                    selectors.push(child);
                }
            });
        }

        return {
            selectors,
        };
    }

    public static generate(ast: IElementHidingRuleBody): string {
        return ast.selectors
            .map((selector) => CssTree.generateSelector(selector))
            .join(CSS_SELECTORS_SEPARATOR + " ");
    }
}
