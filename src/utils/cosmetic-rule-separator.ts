import { SPACE } from "./constants";

/** Represents possible cosmetic rule separators */
export enum CosmeticRuleSeparator {
    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpCssElemhide = "##",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpCssElemhideException = "#@#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpExtCssElemHide = "#?#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpExtCssElemHideException = "#@?#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpSnippet = "#$#",

    /** @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_basic} */
    AbpSnippetException = "#@$#",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#scriptlet-injection} */
    UboScriptlet = "##+js",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#scriptlet-injection} */
    UboScriptletException = "#@#+js",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#html-filters} */
    UboHtml = "##^",

    /** @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#html-filters} */
    UboHtmlException = "#@#^",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#cosmetic-css-rules} */
    AdgCssInject = "#$#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#cosmetic-css-rules} */
    AdgCssInjectException = "#@$#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#extended-css-selectors} */
    AdgExtCssInject = "#$?#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#extended-css-selectors} */
    AdgExtCssInjectException = "#@$?#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#javascript-rules} */
    AdgJsInject = "#%#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#javascript-rules} */
    AdgJsInjectException = "#@%#",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#scriptlets} */
    AdgScriptlet = "#%#//scriptlet",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#scriptlets} */
    AdgScriptletException = "#@%#//scriptlet",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#html-filtering-rules} */
    AdgHtml = "$$",

    /** @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#html-filtering-rules} */
    AdgHtmlException = "$@$",
}

/** In all cases, this means that the separator marks an exception. */
export const EXCEPTION_MARKER = "@";

/** Represents the result of the separator finder */
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

/**
 * CosmeticRuleSeparatorUtils is responsible for solving tasks related to cosmetic rule separators:
 *  - finding
 *  - categorization
 */
export class CosmeticRuleSeparatorUtils {
    /**
     * Returns whether the specified separator is an element hiding separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an element hiding separator, `false` otherwise
     */
    public static isElementHiding(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AbpCssElemhide ||
            separator == CosmeticRuleSeparator.AbpCssElemhideException ||
            separator == CosmeticRuleSeparator.AbpExtCssElemHide ||
            separator == CosmeticRuleSeparator.AbpExtCssElemHideException
        );
    }

    /**
     * Returns whether the specified separator is an AdGuard Css injection separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an AdGuard Css injection separator, `false` otherwise
     */
    public static isAdgCss(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AdgCssInject ||
            separator == CosmeticRuleSeparator.AdgCssInjectException ||
            separator == CosmeticRuleSeparator.AdgExtCssInject ||
            separator == CosmeticRuleSeparator.AdgExtCssInjectException
        );
    }

    /**
     * Returns whether the specified separator is an Adblock Plus snippet separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an Adblock Plus snippet separator, `false` otherwise
     */
    public static isAbpSnippet(separator: string): boolean {
        return separator == CosmeticRuleSeparator.AbpSnippet || separator == CosmeticRuleSeparator.AbpSnippetException;
    }

    /**
     * Returns whether the specified separator is a uBlock scriptlet separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is a uBlock scriptlet separator, `false` otherwise
     */
    public static isUboScriptlet(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.UboScriptlet || separator == CosmeticRuleSeparator.UboScriptletException
        );
    }

    /**
     * Returns whether the specified separator is an AdGuard scriptlet separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an AdGuard scriptlet separator, `false` otherwise
     */
    public static isAdgScriptlet(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AdgScriptlet || separator == CosmeticRuleSeparator.AdgScriptletException
        );
    }

    /**
     * Returns whether the specified separator is an AdGuard JS separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an AdGuard JS separator, `false` otherwise
     */
    public static isAdgJs(separator: string): boolean {
        return (
            separator == CosmeticRuleSeparator.AdgJsInject || separator == CosmeticRuleSeparator.AdgJsInjectException
        );
    }

    /**
     * Returns whether the specified separator is a uBlock HTML separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is a uBlock HTML separator, `false` otherwise
     */
    public static isUboHtml(separator: string): boolean {
        return separator == CosmeticRuleSeparator.UboHtml || separator == CosmeticRuleSeparator.UboHtmlException;
    }

    /**
     * Returns whether the specified separator is an AdGuard HTML separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an AdGuard HTML separator, `false` otherwise
     */
    public static isAdgHtml(separator: string): boolean {
        return separator == CosmeticRuleSeparator.AdgHtml || separator == CosmeticRuleSeparator.AdgHtmlException;
    }

    /**
     * Returns whether the specified separator is a scriptlet separator.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is a scriptlet separator, `false` otherwise
     */
    public static isScriptlet(separator: string): boolean {
        return (
            CosmeticRuleSeparatorUtils.isAbpSnippet(separator) ||
            CosmeticRuleSeparatorUtils.isUboScriptlet(separator) ||
            CosmeticRuleSeparatorUtils.isAdgScriptlet(separator)
        );
    }

    /**
     * Returns whether the specified separator is an exception.
     *
     * @param separator - Separator as string
     * @returns `true` if the specified separator is an exception, `false` otherwise
     */
    public static isException(separator?: string): boolean {
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
     * @param rule - Raw rule
     * @returns Separator data
     */
    public static find(rule: string): CosmeticRuleSeparatorResult {
        return CosmeticRuleSeparatorUtils.findRecursively(rule);
    }

    /**
     * Recursively looks for the cosmetic rule separator in the rule. The basic idea is from TSUrlFilter, this is
     * a further optimized version. The method is very low level, but it is necessary for speed.
     *
     * @param rule - Raw rule.
     * @param hashMarkPos - Latest hashmark character (#) position (if none, then -1).
     * @param dollarSignPos - Latest dollar sign character ($) position (if none, then -1).
     * @param noHashMark - Once we have established that there is no hashmark character (#), it is
     * unnecessary to search for it again in the next step of the recursion.
     * @param noDollarSign - once we have established that there is no dollar sign character ($), it is
     * unnecessary to search for it again in the next step of the recursion.
     * @returns Separator data
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
            // Filter out comments, think 127.0.0.1 localhost ## comment
            // ##
            if (rule[h + 1] == "#" && (h == 0 || rule[h - 1] != SPACE)) {
                // ##+js
                if (rule[h + 2] == "+" && rule[h + 3] == "j" && rule[h + 4] == "s") {
                    return [h, h + 5, CosmeticRuleSeparator.UboScriptlet, false];
                }
                // ##^
                else if (rule[h + 2] == "^") {
                    return [h, h + 3, CosmeticRuleSeparator.UboHtml, false];
                }
                // ##
                return [h, h + 2, CosmeticRuleSeparator.AbpCssElemhide, false];
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
                return [h, h + 3, CosmeticRuleSeparator.AdgCssInject, false];
            }
            // #?#
            else if (rule[h + 1] == "?" && rule[h + 2] == "#") {
                return [h, h + 3, CosmeticRuleSeparator.AbpExtCssElemHide, false];
            }
            // #$?#
            else if (rule[h + 1] == "$" && rule[h + 2] == "?" && rule[h + 3] == "#") {
                return [h, h + 4, CosmeticRuleSeparator.AdgExtCssInject, false];
            } else if (rule[h + 1] == "@") {
                // #@#
                if (rule[h + 2] == "#") {
                    // #@#+js
                    if (rule[h + 3] == "+" && rule[h + 4] == "j" && rule[h + 5] == "s") {
                        return [h, h + 6, CosmeticRuleSeparator.UboScriptletException, true];
                    }
                    // #@#^
                    else if (rule[h + 3] == "^") {
                        return [h, h + 4, CosmeticRuleSeparator.UboHtmlException, true];
                    }
                    return [h, h + 3, CosmeticRuleSeparator.AbpCssElemhideException, true];
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
                    return [h, h + 4, CosmeticRuleSeparator.AbpExtCssElemHideException, true];
                }
                // #@$#
                else if (rule[h + 2] == "$" && rule[h + 3] == "#") {
                    return [h, h + 4, CosmeticRuleSeparator.AdgCssInjectException, true];
                }
                // #@$?#
                else if (rule[h + 2] == "$" && rule[h + 3] == "?" && rule[h + 4] == "#") {
                    return [h, h + 5, CosmeticRuleSeparator.AdgExtCssInjectException, true];
                }
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            !noDollarSign && (d = rule.indexOf("$", dollarSignPos + 1));

            if (d > -1) {
                // $$
                if (rule[d + 1] == "$") {
                    return [d, d + 2, CosmeticRuleSeparator.AdgHtml, false];
                }
                // $@$
                else if (rule[d + 1] == "@" && rule[d + 2] == "$") {
                    return [d, d + 3, CosmeticRuleSeparator.AdgHtmlException, true];
                }
            }

            // Neither # nor $ found
            return [-1, -1, null, null];
        }

        return CosmeticRuleSeparatorUtils.findRecursively(rule, h, d, h == -1, d == -1);
    }
}
