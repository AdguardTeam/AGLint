/**
 * HTML filtering rule body parser
 */

import { Selector, SelectorList } from "css-tree";
import { AdblockSyntax } from "../../../utils/adblockers";
import { ESCAPE_CHARACTER, SPACE } from "../../../utils/constants";
import { CssTree } from "../../../utils/csstree";
import { StringUtils } from "../../../utils/string";

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

    /**
     * Parses a raw cosmetic rule body as an HTML filtering rule body.
     * Please note that compatibility is not yet checked at this point.
     *
     * @param {string} raw - Raw body
     * @returns {IHtmlRuleBody | null} HTML filtering rule body AST
     */
    public static parse(raw: string): IHtmlRuleBody {
        const trimmed = raw.trim();

        const selectors: Selector[] = [];

        // Convert "" to \\" (this theoretically does not affect the uBlock rules)
        const escapedRawBody = HtmlBodyParser.escapeDoubleQuotes(trimmed);

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

    /**
     * Converts an HTML filtering rule body AST to a string.
     *
     * @param {IHtmlRuleBody} ast - HTML filtering rule body AST
     * @param {AdblockSyntax} syntax - Desired syntax of the generated result
     * @returns {string} Raw string
     */
    public static generate(ast: IHtmlRuleBody, syntax: AdblockSyntax): string {
        let result = ast.selectors
            .map((selector) => CssTree.generateSelector(selector))
            .join(CSS_SELECTORS_SEPARATOR + SPACE);

        // In the case of AdGuard syntax, the "" case must be handled
        if (syntax == AdblockSyntax.AdGuard) {
            result = HtmlBodyParser.unescapeDoubleQuotes(result);
        }

        return result;
    }
}
