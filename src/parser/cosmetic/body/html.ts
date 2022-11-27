/**
 * HTML filtering rule body parser
 */

import { Selector, SelectorList } from "css-tree";
import { AdblockSyntax } from "../../../utils/adblockers";
import { CSS_SELECTORS_SEPARATOR, EMPTY, ESCAPE_CHARACTER, SPACE } from "../../../utils/constants";
import { CssTree } from "../../../utils/csstree";
import { CssTreeNodeType, CssTreeParserContext } from "../../../utils/csstree-constants";
import { DOUBLE_QUOTE_MARKER, StringUtils } from "../../../utils/string";

/**Represents an HTML filtering rule body. */
export interface IHtmlRuleBody {
    selectors: Selector[];
}

/**
 * HtmlBodyParser is responsible for parsing the body of HTML filtering rules.
 *
 * Please note that this parser will read ANY selector if it is syntactically correct.
 * Checking whether this selector is actually compatible with a given adblocker is not
 * done at this level.
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#html-filtering-rules}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#html-filters}
 */
export class HtmlBodyParser {
    /**
     * Convert "" to \" within strings, because CSSTree does not recognize "".
     *
     * @param {string} selector - CSS selector string
     * @returns {string} Escaped CSS selector
     * @throws
     *   - If the selector is invalid according to the CSS syntax
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#tag-content}
     */
    public static escapeDoubleQuotes(selector: string): string {
        let withinString = false;
        let result = EMPTY;

        for (let i = 0; i < selector.length; i++) {
            if (!withinString && selector[i] == DOUBLE_QUOTE_MARKER) {
                withinString = true;
                result += selector[i];
            } else if (withinString && selector[i] == DOUBLE_QUOTE_MARKER && selector[i + 1] == DOUBLE_QUOTE_MARKER) {
                result += ESCAPE_CHARACTER + DOUBLE_QUOTE_MARKER;
                i++;
            } else if (withinString && selector[i] == DOUBLE_QUOTE_MARKER && selector[i + 1] != DOUBLE_QUOTE_MARKER) {
                result += DOUBLE_QUOTE_MARKER;
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
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#tag-content}
     */
    public static unescapeDoubleQuotes(selector: string): string {
        let withinString = false;
        let result = EMPTY;

        for (let i = 0; i < selector.length; i++) {
            if (selector[i] == DOUBLE_QUOTE_MARKER && selector[i - 1] != ESCAPE_CHARACTER) {
                withinString = !withinString;
                result += selector[i];
            } else if (withinString && selector[i] == ESCAPE_CHARACTER && selector[i + 1] == DOUBLE_QUOTE_MARKER) {
                result += DOUBLE_QUOTE_MARKER;
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
            selectors.push(<Selector>CssTree.parse(escapedRawBody, CssTreeParserContext.selector));
        }

        // SelectorList
        else {
            const selectorListAst = <SelectorList>CssTree.parse(escapedRawBody, CssTreeParserContext.selectorList);
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
