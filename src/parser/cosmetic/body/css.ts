/**
 * CSS injection rule body parser
 */

import { Selector, SelectorList, MediaQueryList, Block, Rule, generate as generateCss } from "css-tree";
import { AdblockSyntax } from "../../../utils/adblockers";
import {
    CSS_MEDIA_MARKER,
    CSS_PSEUDO_CLOSE,
    CSS_PSEUDO_MARKER,
    CSS_PSEUDO_OPEN,
    EMPTY,
    SPACE,
} from "../../../utils/constants";
import { CssTree } from "../../../utils/csstree";
import { CssTreeNodeType, CssTreeParserContext } from "../../../utils/csstree-constants";

/**
 * `@media <mediaQueryList> { rule }` where rule is `selectorList { declarations block }`
 * This method is much faster than direct parsing (try `atrule`, then `rule` context).
 */
const MEDIA_QUERY_PATTERN = /^(?:@media\s*(?<mediaQueryList>[^{]+))\s*{\s*(?<rule>.+)\s*}$/;

/** selectorList:style(declarations) or selectorList:remove() */
const UBO_CSS_INJECTION_PATTERN =
    /^(?<selectors>.+)(?:(?<style>:style\()(?<declarations>.+)\)|(?<remove>:remove\(\)))$/;

/** selectorList { declarations } */
const ADG_CSS_INJECTION_PATTERN = /^(?:.+){(?:.+)}$/;

const REMOVE_BLOCK = "{ remove: true; }";
const CSS_SELECTORS_SEPARATOR = ",";
const CSS_BLOCK_OPEN = "{";
const CSS_BLOCK_CLOSE = "}";
const UBO_STYLE = "style";
const UBO_REMOVE = "remove";
const UBO_STYLE_MARKER = CSS_PSEUDO_MARKER + UBO_STYLE + CSS_PSEUDO_OPEN;
const UBO_REMOVE_MARKER = CSS_PSEUDO_MARKER + UBO_REMOVE + CSS_PSEUDO_OPEN;

export const REMOVE_BLOCK_TYPE = "remove";

export type CssInjectionBlock = Block | typeof REMOVE_BLOCK_TYPE;

export interface ICssRuleBody {
    mediaQueryList?: MediaQueryList;
    selectors: Selector[];
    block?: CssInjectionBlock;
}

export class CssInjectionBodyParser {
    /**
     * Checks if a selector is a uBlock CSS injection.
     *
     * @param {string} raw - Raw selector body
     * @returns {boolean} true/false
     */
    public static isUblockCssInjection(raw: string): boolean {
        const trimmed = raw.trim();

        // Since it has to run for every elementhide rule, the regex would be slow,
        // so firstly we search for the keywords.
        if (trimmed.indexOf(UBO_STYLE_MARKER) != -1 || trimmed.indexOf(UBO_REMOVE_MARKER) != -1) {
            return UBO_CSS_INJECTION_PATTERN.test(trimmed);
        }

        return false;
    }

    /**
     * Checks if a selector is an AdGuard CSS injection.
     *
     * @param {string} raw - Raw selector body
     * @returns {boolean} true/false
     */
    public static isAdGuardCssInjection(raw: string) {
        return ADG_CSS_INJECTION_PATTERN.test(raw.trim());
    }

    /**
     * Parses a raw selector as an AdGuard CSS injection.
     *
     * @param {string} raw - Raw rule
     * @returns {ICssRuleBody | null} CSS injection AST or null (if the raw rule cannot be parsed
     * as AdGuard CSS injection)
     * @throws
     *   - If the selector is invalid according to the CSS syntax
     *   - If no selector is found
     *   - If several remove properties have been declared
     *   - If there are other declarations in addition to the remove property
     */
    public static parseAdGuardCssInjection(raw: string): ICssRuleBody | null {
        const trimmed = raw.trim();

        // Check pattern first
        if (!CssInjectionBodyParser.isAdGuardCssInjection(trimmed)) {
            return null;
        }

        let mediaQueryList: MediaQueryList | undefined = undefined;
        const selectors: Selector[] = [];
        let rawRule = trimmed;

        // Parse media queries (if any)
        const mediaQueryMatch = trimmed.match(MEDIA_QUERY_PATTERN);
        if (mediaQueryMatch && mediaQueryMatch.groups) {
            mediaQueryList = <MediaQueryList>(
                CssTree.parse(mediaQueryMatch.groups.mediaQueryList.trim(), CssTreeParserContext.mediaQueryList)
            );

            rawRule = mediaQueryMatch.groups.rule.trim();
        }

        // Parse rule part (rule = selector list + declaration block)
        const ruleAst = <Rule>CssTree.parse(rawRule, CssTreeParserContext.rule);

        if (ruleAst.prelude.type !== CssTreeNodeType.SelectorList) {
            throw new Error(`No selector list found in the following CSS injection body: "${raw}"`);
        }

        const selectorListAst = ruleAst.prelude;

        selectorListAst.children.forEach((node) => {
            if (node.type == CssTreeNodeType.Selector) {
                selectors.push(node);
            }
        });

        let block: CssInjectionBlock = ruleAst.block;

        // Check for remove property
        let removeDeclFound = false;
        let nonRemoveDeclFound = false;

        block.children.forEach((node) => {
            if (node.type === CssTreeNodeType.Declaration) {
                if (node.property == REMOVE_BLOCK_TYPE) {
                    if (removeDeclFound) {
                        throw new Error(`Multiple remove property found in the following CSS injection body: "${raw}"`);
                    }
                    removeDeclFound = true;
                } else {
                    nonRemoveDeclFound = true;
                }
            }
        });

        if (removeDeclFound && nonRemoveDeclFound) {
            throw new Error(
                // eslint-disable-next-line max-len
                `In addition to the remove property, the following CSS injection body also uses other properties: "${raw}"`
            );
        }

        if (removeDeclFound) {
            block = REMOVE_BLOCK_TYPE;
        }

        return {
            mediaQueryList,
            selectors,
            block,
        };
    }

    /**
     * Parses a raw selector as a uBlock CSS injection.
     *
     * @param {string} raw - Raw rule
     * @returns {ICssRuleBody | null} CSS injection AST or null (if the raw rule cannot be parsed
     * as uBlock CSS injection)
     */
    public static parseUblockCssInjection(raw: string): ICssRuleBody | null {
        const trimmed = raw.trim();

        // Check pattern first
        const uBlockCssInjection = trimmed.match(UBO_CSS_INJECTION_PATTERN);
        if (!(uBlockCssInjection && uBlockCssInjection.groups)) {
            return null;
        }

        const selectors: Selector[] = [];

        const rawSelectorList = uBlockCssInjection.groups.selectors.trim();
        const selectorListAst = <SelectorList>CssTree.parse(rawSelectorList, CssTreeParserContext.selectorList);

        selectorListAst.children.forEach((node) => {
            if (node.type == CssTreeNodeType.Selector) {
                selectors.push(node);
            }
            // else {
            //     throw new Error(
            //         `Invalid selector found in the following CSS injection body: "${raw}"`
            //     );
            // }
        });

        let block: CssInjectionBlock = REMOVE_BLOCK_TYPE;

        if (uBlockCssInjection.groups.declarations) {
            const rawDeclarations = uBlockCssInjection.groups.declarations.trim();

            // Hack: CSS parser waits for `{declarations}` pattern, so we need { and } chars:
            block = <Block>CssTree.parse(`{${rawDeclarations}}`, CssTreeParserContext.block);
        }

        return {
            selectors,
            block,
        };
    }

    /**
     * Parses a raw selector as a CSS injection. It determines the syntax automatically.
     *
     * @param {string} raw - Raw rule
     * @returns {ICssRuleBody | null} CSS injection AST or null (if the raw rule cannot be parsed
     * as CSS injection)
     */
    public static parse(raw: string): ICssRuleBody | null {
        const trimmed = raw.trim();

        // AdGuard CSS injection
        const result = CssInjectionBodyParser.parseAdGuardCssInjection(trimmed);
        if (result) {
            return result;
        }

        // uBlock CSS injection
        return CssInjectionBodyParser.parseUblockCssInjection(trimmed);
    }

    /**
     * Converts a CSS injection AST to a string.
     *
     * @param {ICssRuleBody} ast - CSS injection rule body AST
     * @param {AdblockSyntax} syntax - Desired syntax of the generated result
     * @returns {string} Raw string
     * @throws
     *   - If you generate a media query with uBlock syntax
     *   - If you enter unsupported syntax
     */
    public static generate(ast: ICssRuleBody, syntax: AdblockSyntax): string {
        let result = EMPTY;

        switch (syntax) {
            case AdblockSyntax.AdGuard: {
                if (ast.mediaQueryList) {
                    result += CSS_MEDIA_MARKER;
                    result += SPACE;
                    result += generateCss(ast.mediaQueryList);
                    result += SPACE;
                    result += CSS_BLOCK_OPEN;
                    result += SPACE;
                }

                // Selectors (comma separated)
                result += ast.selectors
                    .map((selector) => CssTree.generateSelector(selector))
                    .join(CSS_SELECTORS_SEPARATOR + SPACE);

                // Rule body (remove or another declarations)
                result += SPACE;

                if (!ast.block) {
                    result += `${CSS_BLOCK_OPEN} ${CSS_BLOCK_CLOSE}`;
                } else if (ast.block === REMOVE_BLOCK_TYPE) {
                    result += REMOVE_BLOCK;
                } else {
                    result += CSS_BLOCK_OPEN;
                    result += SPACE;
                    result += CssTree.generateBlock(ast.block);
                    result += SPACE;
                    result += CSS_BLOCK_CLOSE;
                }

                if (ast.mediaQueryList) {
                    result += SPACE;
                    result += CSS_BLOCK_CLOSE;
                }
                break;
            }

            case AdblockSyntax.uBlockOrigin: {
                if (ast.mediaQueryList !== undefined) {
                    throw new SyntaxError("uBlock doesn't support media queries");
                }

                // Selectors (comma separated)
                result += ast.selectors
                    .map((selector) => CssTree.generateSelector(selector))
                    .join(CSS_SELECTORS_SEPARATOR + SPACE);

                // Add :remove() or :style() at the end of the injection
                if (!ast.block) {
                    result += CSS_PSEUDO_MARKER;
                    result += UBO_STYLE;
                    result += CSS_PSEUDO_OPEN;
                    result += CSS_PSEUDO_CLOSE;
                } else if (ast.block === REMOVE_BLOCK_TYPE) {
                    result += CSS_PSEUDO_MARKER;
                    result += UBO_REMOVE;
                    result += CSS_PSEUDO_OPEN;
                    result += CSS_PSEUDO_CLOSE;
                } else {
                    result += CSS_PSEUDO_MARKER;
                    result += UBO_STYLE;
                    result += CSS_PSEUDO_OPEN;
                    result += CssTree.generateBlock(ast.block);
                    result += CSS_PSEUDO_CLOSE;
                }

                break;
            }

            default:
                throw new SyntaxError(`Unsupported syntax: ${syntax}`);
        }

        return result;
    }
}
