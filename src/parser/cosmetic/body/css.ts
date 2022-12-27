/**
 * CSS injection rule body parser
 */

import {
    Selector,
    SelectorList,
    Block,
    Rule,
    generate as generateCss,
    SelectorPlain,
    BlockPlain,
    toPlainObject,
    fromPlainObject,
    MediaQueryListPlain,
} from "css-tree";
import { AdblockSyntax } from "../../../utils/adblockers";
import {
    CSS_BLOCK_CLOSE,
    CSS_BLOCK_OPEN,
    CSS_MEDIA_MARKER,
    CSS_PSEUDO_CLOSE,
    CSS_PSEUDO_MARKER,
    CSS_PSEUDO_OPEN,
    CSS_SELECTORS_SEPARATOR,
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
const UBO_STYLE = "style";
const UBO_REMOVE = "remove";
const UBO_STYLE_MARKER = CSS_PSEUDO_MARKER + UBO_STYLE + CSS_PSEUDO_OPEN;
const UBO_REMOVE_MARKER = CSS_PSEUDO_MARKER + UBO_REMOVE + CSS_PSEUDO_OPEN;

export const REMOVE_BLOCK_TYPE = "remove";

/**
 * Represents the CSS rule body, which can be:
 *  - CSS declaration block
 *  - remove
 */
export type CssInjectionBlock = BlockPlain | typeof REMOVE_BLOCK_TYPE;

/**
 * Represents a CSS injection body.
 */
export interface CssRuleBody {
    /**
     * List of media queries (if any)
     */
    mediaQueryList?: MediaQueryListPlain;

    /**
     * List of selectors
     */
    selectors: SelectorPlain[];

    /**
     * CSS declaration block or remove
     */
    block?: CssInjectionBlock;
}

/**
 * `CssInjectionBodyParser` is responsible for parsing a CSS injection body.
 *
 * Please note that not all adblockers support CSS injection in the same way, e.g. uBO does not support media queries.
 *
 * Example rules (AdGuard):
 *  - ```adblock
 *    example.com#$#body { padding-top: 0 !important; }
 *    ```
 *  - ```adblock
 *    example.com#$#@media (min-width: 1024px) { body { padding-top: 0 !important; } }
 *    ```
 *  - ```adblock
 *    example.com#$?#@media (min-width: 1024px) { .something:has(.ads) { padding-top: 0 !important; } }
 *    ```
 *  - ```adblock
 *    example.com#$#.ads { remove: true; }
 *    ```
 *
 * Example rules (uBlock Origin):
 *  - ```adblock
 *    example.com##body:style(padding-top: 0 !important;)
 *    ```
 *  - ```adblock
 *    example.com##.ads:remove()
 *    ```
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#cosmetic-css-rules}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#subjectstylearg}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#subjectremove}
 */
export class CssInjectionBodyParser {
    /**
     * Checks if a selector is a uBlock CSS injection.
     *
     * @param raw - Raw selector body
     * @returns `true` if the selector is a uBlock CSS injection, `false` otherwise
     */
    public static isUboCssInjection(raw: string): boolean {
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
     * @param raw - Raw selector body
     * @returns `true` if the selector is an AdGuard CSS injection, `false` otherwise
     */
    public static isAdgCssInjection(raw: string) {
        return ADG_CSS_INJECTION_PATTERN.test(raw.trim());
    }

    /**
     * Parses a raw selector as an AdGuard CSS injection.
     *
     * @param raw - Raw rule
     * @returns CSS injection AST or null (if the raw rule cannot be parsed
     * as AdGuard CSS injection)
     * @throws
     *   - If the selector is invalid according to the CSS syntax
     *   - If no selector is found
     *   - If several remove properties have been declared
     *   - If there are other declarations in addition to the remove property
     */
    public static parseAdgCssInjection(raw: string): CssRuleBody | null {
        const trimmed = raw.trim();

        // Check pattern first
        if (!CssInjectionBodyParser.isAdgCssInjection(trimmed)) {
            return null;
        }

        let mediaQueryList: MediaQueryListPlain | undefined = undefined;
        const selectors: Selector[] = [];
        let rawRule = trimmed;

        // Parse media queries (if any)
        const mediaQueryMatch = trimmed.match(MEDIA_QUERY_PATTERN);
        if (mediaQueryMatch && mediaQueryMatch.groups) {
            mediaQueryList = <MediaQueryListPlain>(
                CssTree.parsePlain(mediaQueryMatch.groups.mediaQueryList.trim(), CssTreeParserContext.mediaQueryList)
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

        let block: BlockPlain | typeof REMOVE_BLOCK_TYPE = <BlockPlain>toPlainObject(ruleAst.block);

        // Check for remove property
        let removeDeclFound = false;
        let nonRemoveDeclFound = false;

        ruleAst.block.children.forEach((node) => {
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
            selectors: <SelectorPlain[]>selectors.map((selector) => toPlainObject(selector)),
            block,
        };
    }

    /**
     * Parses a raw selector as a uBlock CSS injection.
     *
     * @param raw - Raw rule
     * @returns CSS injection AST or null (if the raw rule cannot be parsed
     * as uBlock CSS injection)
     */
    public static parseUboCssInjection(raw: string): CssRuleBody | null {
        const trimmed = raw.trim();

        // Check pattern first
        const uboCssInjection = trimmed.match(UBO_CSS_INJECTION_PATTERN);
        if (!(uboCssInjection && uboCssInjection.groups)) {
            return null;
        }

        const selectors: Selector[] = [];

        const rawSelectorList = uboCssInjection.groups.selectors.trim();
        const selectorListAst = <SelectorList>CssTree.parse(rawSelectorList, CssTreeParserContext.selectorList);

        selectorListAst.children.forEach((node) => {
            if (node.type == CssTreeNodeType.Selector) {
                selectors.push(node);
            }
        });

        const result: CssRuleBody = {
            selectors: <SelectorPlain[]>selectors.map((selector) => toPlainObject(selector)),
            block: REMOVE_BLOCK_TYPE,
        };

        if (uboCssInjection.groups.declarations) {
            const rawDeclarations = uboCssInjection.groups.declarations.trim();

            // Hack: CSS parser waits for `{declarations}` pattern, so we need { and } chars:
            result.block = <BlockPlain>toPlainObject(CssTree.parse(`{${rawDeclarations}}`, CssTreeParserContext.block));
        }

        return result;
    }

    /**
     * Parses a raw selector as a CSS injection. It determines the syntax automatically.
     *
     * @param raw - Raw rule
     * @returns CSS injection AST or null (if the raw rule cannot be parsed
     * as CSS injection)
     */
    public static parse(raw: string): CssRuleBody | null {
        const trimmed = raw.trim();

        return (
            CssInjectionBodyParser.parseAdgCssInjection(trimmed) || CssInjectionBodyParser.parseUboCssInjection(trimmed)
        );
    }

    /**
     * Converts a CSS injection AST to a string.
     *
     * @param ast - CSS injection rule body AST
     * @param syntax - Desired syntax of the generated result
     * @returns Raw string
     * @throws
     *   - If you generate a media query with uBlock syntax
     *   - If you enter unsupported syntax
     */
    public static generate(ast: CssRuleBody, syntax: AdblockSyntax): string {
        let result = EMPTY;

        switch (syntax) {
            case AdblockSyntax.Adg: {
                if (ast.mediaQueryList) {
                    result += CSS_MEDIA_MARKER;
                    result += SPACE;
                    result += generateCss(fromPlainObject(ast.mediaQueryList));
                    result += SPACE;
                    result += CSS_BLOCK_OPEN;
                    result += SPACE;
                }

                // Selectors (comma separated)
                result += ast.selectors
                    .map((selector) => CssTree.generateSelector(<Selector>fromPlainObject(selector)))
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
                    result += CssTree.generateBlock(<Block>fromPlainObject(ast.block));
                    result += SPACE;
                    result += CSS_BLOCK_CLOSE;
                }

                if (ast.mediaQueryList) {
                    result += SPACE;
                    result += CSS_BLOCK_CLOSE;
                }
                break;
            }

            case AdblockSyntax.Ubo: {
                if (ast.mediaQueryList !== undefined) {
                    throw new SyntaxError("uBlock doesn't support media queries");
                }

                // Selectors (comma separated)
                result += ast.selectors
                    .map((selector) => CssTree.generateSelector(<Selector>fromPlainObject(selector)))
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
                    result += CssTree.generateBlock(<Block>fromPlainObject(ast.block));
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
