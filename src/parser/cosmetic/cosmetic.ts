import { IRule, RuleCategories } from "../common";

// Utils
import { CosmeticRuleSeparator, CosmeticRuleSeparatorUtils } from "../../utils/cosmetic-rule-separator";
import { AdblockSyntax } from "../../utils/adblockers";

// Parsers
import { CommentParser } from "../comment/comment";
import { CssInjectionBodyParser, ICssRuleBody } from "./body/css";
import { ElementHidingBodyParser, IElementHidingRuleBody } from "./body/elementhiding";
import { ScriptletBodyParser, IScriptletRuleBody } from "./body/scriptlet";
import { HtmlBodyParser, IHtmlRuleBody } from "./body/html";
import { DomainListParser, DOMAIN_LIST_TYPE, IDomain } from "../common/domain-list";
import { AdGuardModifierListParser, ADG_MODIFIER_LIST_TYPE } from "./specific/adg-options";
import { IRuleModifier } from "../common/modifier-list";
import { UBlockModifierListParser, UBO_MODIFIER_LIST_TYPE } from "./specific/ubo-options";
import { CosmeticRuleType } from "./common";
import { COMMA, EMPTY, NEWLINE, SEMICOLON, SPACE } from "../../utils/constants";

/**
 * A generic representation of a cosmetic rule.
 *
 * Regarding the categories, there is only a difference in the body,
 * all other properties can be defined at this level.
 */
export interface ICosmeticRule extends IRule {
    category: RuleCategories.Cosmetic;
    type: CosmeticRuleType;
    modifiers: IRuleModifier[];
    domains: IDomain[];
    separator: CosmeticRuleSeparator;
    exception: boolean;
    body: unknown;
}

/**
 * Representation of an element hiding rule.
 *
 * Example rules:
 * - ```adblock
 *   example.com##.ads
 *   ```
 * - ```adblock
 *   example.com#@#.ads
 *   ```
 * - ```adblock
 *   example.com#?#.ads:has(> .something)
 *   ```
 * - ```adblock
 *   example.com#@?#.ads:has(> .something)
 *   ```
 */
export interface IElementHidingRule extends ICosmeticRule {
    type: CosmeticRuleType.ElementHidingRule;
    body: IElementHidingRuleBody;
}

/**
 * Representation of a CSS injection rule.
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
 */
export interface ICssRule extends ICosmeticRule {
    type: CosmeticRuleType.CssRule;
    body: ICssRuleBody;
}

/**
 * Representation of a scriptlet injection rule.
 *
 * Example rules (AdGuard):
 *  - ```adblock
 *    example.com#%#//scriptlet('scriptlet-name', 'arg0', 'arg1')
 *    ```
 *  - ```adblock
 *    example.com#@%#//scriptlet('scriptlet-name', 'arg0', 'arg1')
 *    ```
 *
 * Example rules (uBlock Origin):
 *  - ```adblock
 *    example.com##+js(scriptlet-name, arg0, arg1)
 *    ```
 *  - ```adblock
 *    example.com#@#+js(scriptlet-name, arg0, arg1)
 *    ```
 *
 * Example rules (Adblock Plus):
 *  - ```adblock
 *    example.com#$#scriptlet-name arg0 arg1
 *    ```
 *  - ```adblock
 *    example.com#@$#scriptlet-name arg0 arg1
 *    ```
 *  - ```adblock
 *    example.com#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11
 *    ```
 */
export interface IScriptletRule extends ICosmeticRule {
    type: CosmeticRuleType.ScriptletRule;
    body: IScriptletRuleBody;
}

/**
 * Representation of a HTML filtering rule.
 *
 * Example rules (AdGuard):
 *  - ```adblock
 *    example.com$$script[tag-content="detect"]
 *    ```
 *  - ```adblock
 *    example.com$@$script[tag-content="detect"]
 *    ```
 *
 * Example rules (uBlock Origin):
 *  - ```adblock
 *    example.com##^script:has-text(detect)
 *    ```
 *  - ```adblock
 *    example.com#@#^script:has-text(detect)
 *    ```
 */
export interface IHtmlRule extends ICosmeticRule {
    type: CosmeticRuleType.HtmlRule;
    body: IHtmlRuleBody;
}

/**
 * Representation of a JS injection rule.
 *
 * Example rules (AdGuard):
 *  - ```adblock
 *    example.com#%#let a = 2;
 *    ```
 *  - ```adblock
 *    example.com#@%#let a = 2;
 *    ```
 */
export interface IJsRule extends ICosmeticRule {
    type: CosmeticRuleType.JsRule;
    body: string;
}

/**
 * CosmeticRuleParser is responsible for parsing cosmetic rules.
 *
 * Where possible, it automatically detects the difference between supported syntaxes:
 *  - AdGuard
 *  - uBlock Origin
 *  - Adblock Plus
 *
 * If the syntax is common / cannot be determined, the parser gives `Unknown` syntax.
 *
 * Please note that syntactically correct rules are parsed even if they are not actually
 * compatible with the given adblocker. This is a completely natural behavior, meaningful
 * checking of compatibility is not done at the parser level.
 */
export class CosmeticRuleParser {
    /**
     * Determines whether a rule is a cosmetic rule.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean} true/false
     */
    public static isCosmetic(raw: string) {
        const trimmed = raw.trim();

        if (CommentParser.isComment(trimmed)) {
            return false;
        }

        const [start] = CosmeticRuleSeparatorUtils.find(trimmed);

        return start != -1;
    }

    /**
     * Parses a cosmetic rule. The structure of the cosmetic rules:
     *  - pattern (modifiers + domains in the case of AdGuard)
     *  - separator
     *  - body
     *
     * @param {string} rawRule - Raw cosmetic rule
     * @returns {IElementHidingRule | ICssRule | IScriptletRule | IHtmlRule | IJsRule | null}
     * Parsed cosmetic rule AST or null if it failed to parse based on the known cosmetic rules
     * @throws If the input matches the cosmetic rule pattern but syntactically invalid
     */
    public static parse(rawRule: string): IElementHidingRule | ICssRule | IScriptletRule | IHtmlRule | IJsRule | null {
        // Skip regular comments
        if (CommentParser.isRegularComment(rawRule)) {
            return null;
        }

        // Find separator (every cosmetic rule has a separator)
        const [start, end, separator, exception] = CosmeticRuleSeparatorUtils.find(rawRule);

        if (!separator) {
            return null;
        }

        // Find main structural elements
        let rawPattern = rawRule.substring(0, start).trim();
        let rawBody = rawRule.substring(end).trim();

        // The syntax is initially unknown
        let syntax = AdblockSyntax.Unknown;

        const modifiers: IRuleModifier[] = [];

        // Handle pattern
        const { modifiers: adgModifiers, rest: adgRest } = AdGuardModifierListParser.parse(rawPattern);

        if (adgModifiers.length > 0) {
            modifiers.push(...adgModifiers);

            syntax = AdblockSyntax.AdGuard;
            rawPattern = adgRest;
        }

        let domains: IDomain[] = [];

        if (rawPattern.length > 0) {
            domains = DomainListParser.parse(rawPattern).domains;
        }

        // Parse body (depends on the type of separator)

        // Element hiding / uBO CSS inject
        if (CosmeticRuleSeparatorUtils.isElementHiding(separator)) {
            const { modifiers: uboModifiers, rest: uboRest } = UBlockModifierListParser.parse(rawBody);

            if (uboModifiers.length > 0) {
                if (syntax == AdblockSyntax.AdGuard) {
                    throw new SyntaxError(`Cannot use AdGuard modifier list with uBO options`);
                }

                modifiers.push(...uboModifiers);

                syntax = AdblockSyntax.uBlockOrigin;
                rawBody = uboRest;
            }

            if (CssInjectionBodyParser.isUblockCssInjection(rawBody)) {
                if (syntax == AdblockSyntax.AdGuard) {
                    throw new SyntaxError(`Cannot use AdGuard modifier list with uBO's CSS injection`);
                }

                syntax = AdblockSyntax.uBlockOrigin;

                const body = CssInjectionBodyParser.parseUblockCssInjection(rawBody);

                // if (!body) {
                //     throw new SyntaxError(`Invalid uBlock CSS injection: "${rawBody}"`);
                // }

                return <ICssRule>{
                    category: RuleCategories.Cosmetic,
                    type: CosmeticRuleType.CssRule,
                    syntax,
                    exception,
                    modifiers,
                    domains,
                    separator,
                    body,
                };
            }

            // Regular elemhide rules
            else {
                return <IElementHidingRule>{
                    category: RuleCategories.Cosmetic,
                    type: CosmeticRuleType.ElementHidingRule,
                    syntax,
                    exception,
                    modifiers,
                    domains,
                    separator,
                    body: ElementHidingBodyParser.parse(rawBody),
                };
            }
        }

        // ADG CSS inject / ABP snippet inject
        else if (CosmeticRuleSeparatorUtils.isAdGuardCss(separator)) {
            if (CssInjectionBodyParser.isAdGuardCssInjection(rawBody)) {
                const body = CssInjectionBodyParser.parseAdGuardCssInjection(rawBody);

                // if (!body) {
                //     throw new SyntaxError(`Invalid AdGuard CSS injection: "${rawBody}"`);
                // }

                return <ICssRule>{
                    category: RuleCategories.Cosmetic,
                    type: CosmeticRuleType.CssRule,
                    syntax: AdblockSyntax.AdGuard,
                    exception,
                    modifiers,
                    domains,
                    separator,
                    body,
                };
            }

            return <IScriptletRule>{
                category: RuleCategories.Cosmetic,
                type: CosmeticRuleType.ScriptletRule,
                syntax: AdblockSyntax.AdblockPlus,
                exception,
                modifiers,
                domains,
                separator,
                body: ScriptletBodyParser.parseAbpSnippetCall(rawBody),
            };
        }

        // ADG/uBO scriptlets
        else if (
            CosmeticRuleSeparatorUtils.isAdGuardScriptlet(separator) ||
            CosmeticRuleSeparatorUtils.isUblockScriptlet(separator)
        ) {
            // Set syntax
            syntax = AdblockSyntax.AdGuard;
            if (CosmeticRuleSeparatorUtils.isUblockScriptlet(separator)) {
                syntax = AdblockSyntax.uBlockOrigin;
            }

            return <IScriptletRule>{
                category: RuleCategories.Cosmetic,
                type: CosmeticRuleType.ScriptletRule,
                syntax,
                exception,
                modifiers,
                domains,
                separator,
                body: ScriptletBodyParser.parseAdgAndUboScriptletCall(rawBody),
            };
        }

        // ADG/uBO HTML filters
        else if (
            CosmeticRuleSeparatorUtils.isUblockHtml(separator) ||
            CosmeticRuleSeparatorUtils.isAdGuardHtml(separator)
        ) {
            // Special case: uBO's network rule
            if (CosmeticRuleSeparatorUtils.isUblockHtml(separator) && rawBody.startsWith("responseheader(")) {
                return null;
            }

            // Set syntax
            if (CosmeticRuleSeparatorUtils.isUblockHtml(separator)) {
                syntax = AdblockSyntax.uBlockOrigin;
            } else {
                syntax = AdblockSyntax.AdGuard;
            }

            const { modifiers: uboModifiers, rest: uboRest } = UBlockModifierListParser.parse(rawBody);

            if (uboModifiers.length > 0) {
                if (CosmeticRuleSeparatorUtils.isAdGuardHtml(separator)) {
                    throw new SyntaxError(`Cannot use uBO options with ADG HTML filtering`);
                }

                if (syntax == AdblockSyntax.AdGuard || adgModifiers.length > 0) {
                    throw new SyntaxError(`Cannot use AdGuard modifier list with uBO options`);
                }

                modifiers.push(...uboModifiers);

                syntax = AdblockSyntax.uBlockOrigin;
                rawBody = uboRest;
            }

            return <IHtmlRule>{
                category: RuleCategories.Cosmetic,
                type: CosmeticRuleType.HtmlRule,
                syntax,
                exception,
                modifiers,
                domains,
                separator,
                body: HtmlBodyParser.parse(rawBody),
            };
        }

        // ADG JS inject
        else if (CosmeticRuleSeparatorUtils.isAdGuardJs(separator)) {
            return <IJsRule>{
                category: RuleCategories.Cosmetic,
                type: CosmeticRuleType.JsRule,
                syntax: AdblockSyntax.AdGuard,
                exception,
                modifiers,
                domains,
                separator,
                body: rawBody,
            };
        }

        return null;
    }

    /**
     * Converts a cosmetic rule AST into a string.
     *
     * @param {ICosmeticRule} ast - Cosmetic rule AST
     * @returns {string} Raw string
     */
    public static generate(ast: ICosmeticRule): string {
        let result = EMPTY;

        // AdGuard modifiers
        if (ast.syntax == AdblockSyntax.AdGuard && ast.modifiers.length > 0) {
            result += AdGuardModifierListParser.generate({
                type: ADG_MODIFIER_LIST_TYPE,
                modifiers: ast.modifiers,
                rest: EMPTY,
            });
        }

        // Domains
        result += DomainListParser.generate({
            type: DOMAIN_LIST_TYPE,
            separator: COMMA,
            domains: ast.domains,
        });

        switch (ast.type) {
            case CosmeticRuleType.ElementHidingRule:
                result += ast.separator;

                if (ast.syntax == AdblockSyntax.uBlockOrigin && ast.modifiers.length > 0) {
                    result += UBlockModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: ElementHidingBodyParser.generate(<IElementHidingRuleBody>ast.body),
                    });
                } else {
                    result += ElementHidingBodyParser.generate(<IElementHidingRuleBody>ast.body);
                }
                break;

            case CosmeticRuleType.CssRule:
                result += ast.separator;

                if (ast.syntax == AdblockSyntax.uBlockOrigin && ast.modifiers.length > 0) {
                    result += UBlockModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: CssInjectionBodyParser.generate(<ICssRuleBody>ast.body, ast.syntax),
                    });
                } else {
                    result += CssInjectionBodyParser.generate(<ICssRuleBody>ast.body, ast.syntax);
                }
                break;

            case CosmeticRuleType.HtmlRule:
                result += ast.separator;

                if (ast.syntax == AdblockSyntax.uBlockOrigin && ast.modifiers.length > 0) {
                    result += UBlockModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: HtmlBodyParser.generate(<IHtmlRuleBody>ast.body, ast.syntax),
                    });
                } else {
                    result += HtmlBodyParser.generate(<IHtmlRuleBody>ast.body, ast.syntax);
                }
                break;

            case CosmeticRuleType.JsRule:
                result += ast.separator;

                // Native JS code
                result += ast.body;
                break;

            case CosmeticRuleType.ScriptletRule:
                result += ast.separator;

                // eslint-disable-next-line no-case-declarations
                const scriptlets = ScriptletBodyParser.generate(<IScriptletRuleBody>ast.body, ast.syntax);

                if (ast.syntax == AdblockSyntax.AdblockPlus) {
                    result += scriptlets.join(SEMICOLON + SPACE);
                    return result;
                } else {
                    const rules = [];

                    // Render ADG/uBO rules "separately"
                    for (const scriptlet of scriptlets) {
                        rules.push(result + scriptlet);
                    }

                    return rules.join(NEWLINE);
                }
        }

        return result;
    }
}
