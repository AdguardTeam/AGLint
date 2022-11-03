/**
 * CSS injection rule body parser
 */

import { Selector, SelectorList, MediaQueryList, Block, Rule, generate as generateCss } from "css-tree";
import { AdblockSyntax } from "../../../utils/adblockers";
import { CssTree } from "../../../utils/csstree";

/**
 * `@media <mediaQueryList> { rule }` where rule is `selectorList { declarations block }`
 * This method is much faster than direct parsing (try `atrule`, then `rule` context).
 */
const MEDIA_QUERY_PATTERN = /^(?:@media\s+(?<mediaQueryList>[^{]+))\s*{\s*(?<rule>.+)\s*}$/;

/** selectorList:style(declarations) or selectorList:remove() */
const UBO_CSS_INJECTION_PATTERN =
    /^(?<selectors>.+)(?:(?<style>:style\()(?<declarations>.+)\)|(?<remove>:remove\(\)))$/;

/** selectorList { declarations } */
const ADG_CSS_INJECTION_PATTERN = /^(?:.+){(?:.+)}$/;

const REMOVE_BLOCK = "{ remove: true; }";
const CSS_SELECTORS_SEPARATOR = ",";
const CSS_BLOCK_OPEN = "{";
const CSS_BLOCK_CLOSE = "}";

export type RemoveBlock = "remove";
export type CssInjectionBlock = Block | RemoveBlock;

export interface ICssRuleBody {
    mediaQueryList?: MediaQueryList;
    selectors: Selector[];
    block?: CssInjectionBlock;
}

export class CssInjectionBodyParser {
    /**
     * Since it has to run for every elementhide rule, the regex would be slow, so firstly we search for the keywords.
     *
     * @param {string} raw - Raw selector body
     * @returns {boolean} true/false
     */
    public static isUblockCssInjection(raw: string): boolean {
        const trimmed = raw.trim();

        if (trimmed.indexOf(":style(") != -1 || trimmed.endsWith(":remove()")) {
            return UBO_CSS_INJECTION_PATTERN.test(trimmed);
        }

        return false;
    }

    public static isAdGuardCssInjection(raw: string) {
        return ADG_CSS_INJECTION_PATTERN.test(raw.trim());
    }

    public static parseAdGuardCssInjection(raw: string): ICssRuleBody | null {
        const trimmed = raw.trim();

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
                CssTree.parse(mediaQueryMatch.groups.mediaQueryList.trim(), "mediaQueryList")
            );

            rawRule = mediaQueryMatch.groups.rule.trim();
        }

        // Parse rule part (rule = selector list + declaration block)
        const ruleAst = <Rule>CssTree.parse(rawRule, "rule");

        if (ruleAst.prelude.type !== "SelectorList") {
            throw new Error(`No selector list found in the following CSS injection body: "${raw}"`);
        }

        const selectorListAst = ruleAst.prelude;

        selectorListAst.children.forEach((node) => {
            if (node.type == "Selector") {
                selectors.push(node);
            }
        });

        let block: CssInjectionBlock = ruleAst.block;

        // Check for remove property
        let removeDeclFound = false;
        let nonRemoveDeclFound = false;

        block.children.forEach((node) => {
            if (node.type === "Declaration") {
                if (node.property == "remove") {
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
            block = "remove";
        }

        return {
            mediaQueryList,
            selectors,
            block,
        };
    }

    public static parseUblockCssInjection(raw: string): ICssRuleBody | null {
        const trimmed = raw.trim();

        // uBlock CSS injection
        const uBlockCssInjection = trimmed.match(UBO_CSS_INJECTION_PATTERN);
        if (!(uBlockCssInjection && uBlockCssInjection.groups)) {
            return null;
        }

        const selectors: Selector[] = [];

        const rawSelectorList = uBlockCssInjection.groups.selectors.trim();
        const selectorListAst = <SelectorList>CssTree.parse(rawSelectorList, "selectorList");

        selectorListAst.children.forEach((node) => {
            if (node.type == "Selector") {
                selectors.push(node);
            }
            // else {
            //     throw new Error(
            //         `Invalid selector found in the following CSS injection body: "${raw}"`
            //     );
            // }
        });

        let block: CssInjectionBlock = "remove";

        if (uBlockCssInjection.groups.declarations) {
            const rawDeclarations = uBlockCssInjection.groups.declarations.trim();

            // Hack: CSS parser waits for `{declarations}` pattern, so we need { and } chars:
            block = <Block>CssTree.parse(`{${rawDeclarations}}`, "block");
        }

        return {
            selectors,
            block,
        };
    }

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

    public static generate(ast: ICssRuleBody, syntax: AdblockSyntax): string {
        let result = "";

        switch (syntax) {
            case AdblockSyntax.AdGuard:
                if (ast.mediaQueryList) {
                    result += "@media ";
                    result += generateCss(ast.mediaQueryList);
                    result += " " + CSS_BLOCK_OPEN + " ";
                }

                // Selectors (comma separated)
                result += ast.selectors
                    .map((selector) => CssTree.generateSelector(selector))
                    .join(CSS_SELECTORS_SEPARATOR + " ");

                // Rule body (remove or another declarations)
                result += " ";

                if (!ast.block) {
                    result += `${CSS_BLOCK_OPEN} ${CSS_BLOCK_CLOSE}`;
                } else if (ast.block === "remove") {
                    result += REMOVE_BLOCK;
                } else {
                    result += CSS_BLOCK_OPEN + " ";
                    result += CssTree.generateBlock(ast.block);
                    result += " " + CSS_BLOCK_CLOSE;
                }

                if (ast.mediaQueryList) {
                    result += " " + CSS_BLOCK_CLOSE;
                }
                break;

            case AdblockSyntax.uBlockOrigin: {
                if (ast.mediaQueryList !== undefined) {
                    throw new SyntaxError("uBlock doesn't support media queries");
                }

                // Selectors (comma separated)
                result += ast.selectors
                    .map((selector) => CssTree.generateSelector(selector))
                    .join(CSS_SELECTORS_SEPARATOR + " ");

                // Add :remove() or :style() at the end of the injection
                if (!ast.block) {
                    result += ":style()";
                } else if (ast.block === "remove") {
                    result += ":remove()";
                } else {
                    result += ":style(";
                    result += CssTree.generateBlock(ast.block);
                    result += ")";
                }
            }
        }

        return result;
    }
}
