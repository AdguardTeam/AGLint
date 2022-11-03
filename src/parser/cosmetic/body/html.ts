/**
 * HTML filtering rule body parser
 */

import { Selector, SelectorList } from "css-tree";
import { AdblockSyntax } from "../../../utils/adblockers";
import { CssTree } from "../../../utils/csstree";
import { ESCAPE_CHARACTER, StringUtils } from "../../../utils/string";

const CSS_SELECTORS_SEPARATOR = ",";

export interface IHtmlRuleBody {
    selectors: Selector[];
}

export class HtmlBodyParser {
    /**
     * Convert "" to \" within strings. The CSS parser does not recognize "".
     *
     * @param {string} selector - CSS selector string
     * @returns {string} Escaped CSS selector
     */
    public static escapeDoubleQuotes(selector: string): string {
        let withinString = false;
        let result = "";

        for (let i = 0; i < selector.length; i++) {
            if (!withinString && selector[i] == '"') {
                withinString = true;
                result += selector[i];
            } else if (withinString && selector[i] == '"' && selector[i + 1] == '"') {
                result += ESCAPE_CHARACTER + '"';
                i++;
            } else if (withinString && selector[i] == '"' && selector[i + 1] != '"') {
                result += '"';
                withinString = false;
            } else {
                result += selector[i];
            }
        }

        return result;
    }

    /**
     * Convert \" to "" within strings.
     *
     * @param {string} selector - CSS selector string
     * @returns {string} Unescaped CSS selector
     */
    public static unescapeDoubleQuotes(selector: string): string {
        let withinString = false;
        let result = "";

        for (let i = 0; i < selector.length; i++) {
            if (selector[i] == '"' && selector[i - 1] != ESCAPE_CHARACTER) {
                withinString = !withinString;
                result += selector[i];
            } else if (withinString && selector[i] == ESCAPE_CHARACTER && selector[i + 1] == '"') {
                result += '"';
            } else {
                result += selector[i];
            }
        }

        return result;
    }

    public static parse(raw: string): IHtmlRuleBody {
        const selectors: Selector[] = [];

        // Convert "" -> \\"
        const escapedRawBody = HtmlBodyParser.escapeDoubleQuotes(raw);

        // Selector
        if (StringUtils.findNextUnescapedCharacter(escapedRawBody, CSS_SELECTORS_SEPARATOR) == -1) {
            selectors.push(<Selector>CssTree.parse(escapedRawBody, "selector"));
        }

        // SelectorList
        else {
            const selectorListAst = <SelectorList>CssTree.parse(escapedRawBody, "selectorList");
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

    public static generate(ast: IHtmlRuleBody, syntax: AdblockSyntax): string {
        let result = ast.selectors
            .map((selector) => CssTree.generateSelector(selector))
            .join(CSS_SELECTORS_SEPARATOR + " ");

        if (syntax == AdblockSyntax.AdGuard) {
            result = HtmlBodyParser.unescapeDoubleQuotes(result);
        }

        return result;
    }
}
