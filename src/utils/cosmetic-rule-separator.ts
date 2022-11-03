import { SPACE } from "./constants";

export enum CosmeticRuleSeparator {
    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpCSSElemhide = "##",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpCSSElemhideException = "#@#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpExtCSSElemHide = "#?#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpExtCSSElemHideException = "#@?#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpSnippet = "#$#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpSnippetException = "#@$#",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#scriptlet-injection} */
    uBoScriptlet = "##+js",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#scriptlet-injection} */
    uBoScriptletException = "#@#+js",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#html-filters} */
    uBoHTML = "##^",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#html-filters} */
    uBoHTMLException = "#@#^",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#cosmetic-css-rules} */
    AdgCSSInject = "#$#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#cosmetic-css-rules} */
    AdgCSSInjectException = "#@$#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#extended-css-selectors} */
    AdgExtCSSInject = "#$?#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#extended-css-selectors} */
    AdgExtCSSInjectException = "#@$?#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#javascript-rules} */
    AdgJsInject = "#%#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#javascript-rules} */
    AdgJsInjectException = "#@%#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#scriptlets} */
    AdgScriptlet = "#%#//scriptlet",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#scriptlets} */
    AdgScriptletException = "#@%#//scriptlet",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#html-filtering-rules} */
    AdgHTML = "$$",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#html-filtering-rules} */
    AdgHTMLException = "$@$",
}

export const EXCEPTION_MARKER = "@";

export type CosmeticRuleSeparatorResult = [
    /**
     * Separator start position
     */
    number,

    /**
     * Separator end position
     */
    number,

    /**
     * The separator itself
     */
    CosmeticRuleSeparator | null,

    /**
     * Is exception separator
     */
    boolean | null
];

export class CosmeticRuleSeparatorUtils {
    /**
     * Returns whether the specified separator is an element hiding separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isElementHiding(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AbpCSSElemhide ||
            separator == CosmeticRuleSeparator.AbpCSSElemhideException ||
            separator == CosmeticRuleSeparator.AbpExtCSSElemHide ||
            separator == CosmeticRuleSeparator.AbpExtCSSElemHideException
        );
    }

    /**
     * Returns whether the specified separator is an AdGuard CSS injection separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isAdGuardCss(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AdgCSSInject ||
            separator == CosmeticRuleSeparator.AdgCSSInjectException ||
            separator == CosmeticRuleSeparator.AdgExtCSSInject ||
            separator == CosmeticRuleSeparator.AdgExtCSSInjectException
        );
    }

    /**
     * Returns whether the specified separator is an Adblock Plus snippet separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isAdblockPlusSnippet(separator: string): boolean {
        return separator == CosmeticRuleSeparator.AbpSnippet || separator == CosmeticRuleSeparator.AbpSnippetException;
    }

    /**
     * Returns whether the specified separator is a uBlock scriptlet separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isUblockScriptlet(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.uBoScriptlet || separator == CosmeticRuleSeparator.uBoScriptletException
        );
    }

    /**
     * Returns whether the specified separator is an AdGuard scriptlet separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isAdGuardScriptlet(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AdgScriptlet || separator == CosmeticRuleSeparator.AdgScriptletException
        );
    }

    /**
     * Returns whether the specified separator is an AdGuard JS separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isAdGuardJs(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AdgJsInject || separator == CosmeticRuleSeparator.AdgJsInjectException
        );
    }

    /**
     * Returns whether the specified separator is a uBlock HTML separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isUblockHtml(separator: string): boolean {
        return separator == CosmeticRuleSeparator.uBoHTML || separator == CosmeticRuleSeparator.uBoHTMLException;
    }

    /**
     * Returns whether the specified separator is an AdGuard HTML separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isAdGuardHtml(separator: string): boolean {
        return separator == CosmeticRuleSeparator.AdgHTML || separator == CosmeticRuleSeparator.AdgHTMLException;
    }

    /**
     * Returns whether the specified separator is a scriptlet separator.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isScriptlet(separator: string): boolean {
        return (
            CosmeticRuleSeparatorUtils.isAdblockPlusSnippet(separator) ||
            CosmeticRuleSeparatorUtils.isUblockScriptlet(separator) ||
            CosmeticRuleSeparatorUtils.isAdGuardScriptlet(separator)
        );
    }

    /**
     * Returns whether the specified separator is an exception.
     *
     * @param {string} separator - Separator as string
     * @returns {boolean} true/false
     */
    public static isException(separator: string | undefined): boolean {
        if (!separator) {
            return false;
        }

        // Currently, the 2nd character marks the exception in all cases
        return separator[1] === EXCEPTION_MARKER;
    }

    /**
     * Looks for the cosmetic rule separator in the rule. This is a simplified version that
     * masks the recursive function.
     *
     * @param {string} rule - Raw rule
     * @returns {CosmeticRuleSeparatorResult} Separator data
     */
    public static find(rule: string): CosmeticRuleSeparatorResult {
        return CosmeticRuleSeparatorUtils.findRecursively(rule);
    }

    /**
     * Recursively looks for the cosmetic rule separator in the rule. The basic idea is from TSUrlFilter, this is
     * a further optimized version. The method is very low level, but it is necessary for speed.
     *
     * @param {string} rule - Raw rule.
     * @param {number} hashMarkPos - Latest hashmark character (#) position (if none, then -1).
     * @param {number} dollarSignPos - Latest dollar sign character ($) position (if none, then -1).
     * @param {boolean} noHashMark - Once we have established that there is no hashmark character (#), it is
     * unnecessary to search for it again in the next step of the recursion.
     * @param {boolean} noDollarSign - once we have established that there is no dollar sign character ($), it is
     * unnecessary to search for it again in the next step of the recursion.
     * @returns {CosmeticRuleSeparatorResult} Separator data
     */
    private static findRecursively(
        rule: string,
        hashMarkPos = -1,
        dollarSignPos = -1,
        noHashMark = false,
        noDollarSign = false
    ): CosmeticRuleSeparatorResult {
        // Using -2 instead of -1 in order to provide proper recursion,
        // think `example.com$$script[tag-content="#example"]`.
        // h means hashmark (#), d means dollar sign ($).
        let h = -2,
            d = -2;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        !noHashMark && (h = rule.indexOf("#", hashMarkPos + 1));

        if (h > -1) {
            // Filter out comments, tink 127.0.0.1 localhost ## comment
            // ##
            if (rule[h + 1] == "#" && (h == 0 || rule[h - 1] != SPACE)) {
                // ##+js
                if (rule[h + 2] == "+" && rule[h + 3] == "j" && rule[h + 4] == "s") {
                    return [h, h + 5, CosmeticRuleSeparator.uBoScriptlet, false];
                }
                // ##^
                else if (rule[h + 2] == "^") {
                    return [h, h + 3, CosmeticRuleSeparator.uBoHTML, false];
                }
                // ##
                return [h, h + 2, CosmeticRuleSeparator.AbpCSSElemhide, false];
            }
            // #%#
            else if (rule[h + 1] == "%" && rule[h + 2] == "#") {
                // #%#//scriptlet
                if (
                    rule[h + 3] == "/" &&
                    rule[h + 4] == "/" &&
                    rule[h + 5] == "s" &&
                    rule[h + 6] == "c" &&
                    rule[h + 7] == "r" &&
                    rule[h + 8] == "i" &&
                    rule[h + 9] == "p" &&
                    rule[h + 10] == "t" &&
                    rule[h + 11] == "l" &&
                    rule[h + 12] == "e" &&
                    rule[h + 13] == "t"
                ) {
                    return [h, h + 14, CosmeticRuleSeparator.AdgScriptlet, false];
                }
                return [h, h + 3, CosmeticRuleSeparator.AdgJsInject, false];
            }
            // #$#
            else if (rule[h + 1] == "$" && rule[h + 2] == "#") {
                return [h, h + 3, CosmeticRuleSeparator.AdgCSSInject, false];
            }
            // #?#
            else if (rule[h + 1] == "?" && rule[h + 2] == "#") {
                return [h, h + 3, CosmeticRuleSeparator.AbpExtCSSElemHide, false];
            }
            // #$?#
            else if (rule[h + 1] == "$" && rule[h + 2] == "?" && rule[h + 3] == "#") {
                return [h, h + 4, CosmeticRuleSeparator.AdgExtCSSInject, false];
            } else if (rule[h + 1] == "@") {
                // #@#
                if (rule[h + 2] == "#") {
                    // #@#+js
                    if (rule[h + 3] == "+" && rule[h + 4] == "j" && rule[h + 5] == "s") {
                        return [h, h + 6, CosmeticRuleSeparator.uBoScriptletException, true];
                    }
                    // #@#^
                    else if (rule[h + 3] == "^") {
                        return [h, h + 4, CosmeticRuleSeparator.uBoHTMLException, true];
                    }
                    return [h, h + 3, CosmeticRuleSeparator.AbpCSSElemhideException, true];
                }
                // #@%#
                else if (rule[h + 2] == "%" && rule[h + 3] == "#") {
                    // #%#//scriptlet
                    if (
                        rule[h + 4] == "/" &&
                        rule[h + 5] == "/" &&
                        rule[h + 6] == "s" &&
                        rule[h + 7] == "c" &&
                        rule[h + 8] == "r" &&
                        rule[h + 9] == "i" &&
                        rule[h + 10] == "p" &&
                        rule[h + 11] == "t" &&
                        rule[h + 12] == "l" &&
                        rule[h + 13] == "e" &&
                        rule[h + 14] == "t"
                    ) {
                        return [h, h + 15, CosmeticRuleSeparator.AdgScriptletException, true];
                    }
                    return [h, h + 4, CosmeticRuleSeparator.AdgJsInjectException, true];
                }
                // #@?#
                else if (rule[h + 2] == "?" && rule[h + 3] == "#") {
                    return [h, h + 4, CosmeticRuleSeparator.AbpExtCSSElemHideException, true];
                }
                // #@$#
                else if (rule[h + 2] == "$" && rule[h + 3] == "#") {
                    return [h, h + 4, CosmeticRuleSeparator.AdgCSSInjectException, true];
                }
                // #@$?#
                else if (rule[h + 2] == "$" && rule[h + 3] == "?" && rule[h + 4] == "#") {
                    return [h, h + 5, CosmeticRuleSeparator.AdgExtCSSInjectException, true];
                }
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            !noDollarSign && (d = rule.indexOf("$", dollarSignPos + 1));

            if (d > -1) {
                // $$
                if (rule[d + 1] == "$") {
                    return [d, d + 2, CosmeticRuleSeparator.AdgHTML, false];
                }
                // $@$
                else if (rule[d + 1] == "@" && rule[d + 2] == "$") {
                    return [d, d + 3, CosmeticRuleSeparator.AdgHTMLException, true];
                }
            }

            // Neither # nor $ found
            return [-1, -1, null, null];
        }

        return CosmeticRuleSeparatorUtils.findRecursively(rule, h, d, h == -1, d == -1);
    }
}
