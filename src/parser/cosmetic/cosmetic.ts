import { Rule, RuleCategory } from "../common";

// Utils
import { CosmeticRuleSeparator, CosmeticRuleSeparatorUtils } from "../../utils/cosmetic-rule-separator";
import { AdblockSyntax } from "../../utils/adblockers";

// Parsers
import { CommentParser } from "../comment/comment";
import { CssInjectionBodyParser, CssRuleBody } from "./body/css";
import { ElementHidingBodyParser, ElementHidingRuleBody } from "./body/elementhiding";
import { ScriptletBodyParser, ScriptletRuleBody } from "./body/scriptlet";
import { HtmlBodyParser, HtmlRuleBody } from "./body/html";
import { DomainListParser, DOMAIN_LIST_TYPE, Domain } from "../common/domain-list";
import { AdgModifierListParser, ADG_MODIFIER_LIST_TYPE } from "./specific/adg-options";
import { RuleModifier } from "../common/modifier-list";
import { UboModifier, UboModifierListParser, UBO_MODIFIER_LIST_TYPE } from "./specific/ubo-options";
import { CosmeticRuleType } from "./common";
import { COMMA, EMPTY, NEWLINE, SEMICOLON, SPACE } from "../../utils/constants";
import { UBO_RESPONSEHEADER_INDICATOR } from "../network/network";

/**
 * A generic representation of a cosmetic rule.
 *
 * Regarding the categories, there is only a difference in the body,
 * all other properties can be defined at this level.
 */
export interface CosmeticRule extends Rule {
    category: RuleCategory.Cosmetic;
    type: CosmeticRuleType;
    modifiers: RuleModifier[] | UboModifier[];
    domains: Domain[];
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
export interface ElementHidingRule extends CosmeticRule {
    type: CosmeticRuleType.ElementHidingRule;
    body: ElementHidingRuleBody;
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
export interface CssRule extends CosmeticRule {
    type: CosmeticRuleType.CssRule;
    body: CssRuleBody;
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
export interface ScriptletRule extends CosmeticRule {
    type: CosmeticRuleType.ScriptletRule;
    body: ScriptletRuleBody;
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
export interface HtmlRule extends CosmeticRule {
    type: CosmeticRuleType.HtmlRule;
    body: HtmlRuleBody;
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
export interface JsRule extends CosmeticRule {
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
     * @param raw - Raw rule
     * @returns true/false
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
     * @param rawRule - Raw cosmetic rule
     * @returns
     * Parsed cosmetic rule AST or null if it failed to parse based on the known cosmetic rules
     * @throws If the input matches the cosmetic rule pattern but syntactically invalid
     */
    public static parse(rawRule: string): ElementHidingRule | CssRule | ScriptletRule | HtmlRule | JsRule | null {
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

        const modifiers: RuleModifier[] = [];

        // Handle pattern
        const { modifiers: adgModifiers, rest: adgRest } = AdgModifierListParser.parse(rawPattern);

        if (adgModifiers.length > 0) {
            modifiers.push(...adgModifiers);

            syntax = AdblockSyntax.Adg;
            rawPattern = adgRest;
        }

        let domains: Domain[] = [];

        if (rawPattern.length > 0) {
            domains = DomainListParser.parse(rawPattern).domains;
        }

        // Parse body (depends on the type of separator)

        // Element hiding / uBO CSS inject
        if (CosmeticRuleSeparatorUtils.isElementHiding(separator)) {
            if (UboModifierListParser.hasUboModifierIndicators(rawBody)) {
                const { modifiers: uboModifiers, rest: uboRest } = UboModifierListParser.parse(rawBody);

                if (uboModifiers.length > 0) {
                    if (syntax == AdblockSyntax.Adg) {
                        throw new SyntaxError(`Cannot use AdGuard modifier list with uBO options`);
                    }

                    modifiers.push(...uboModifiers);

                    syntax = AdblockSyntax.Ubo;
                    rawBody = uboRest;
                }
            }

            if (CssInjectionBodyParser.isUboCssInjection(rawBody)) {
                if (syntax == AdblockSyntax.Adg) {
                    throw new SyntaxError(`Cannot use AdGuard modifier list with uBO's CSS injection`);
                }

                syntax = AdblockSyntax.Ubo;

                const body = CssInjectionBodyParser.parseUboCssInjection(rawBody);

                return <CssRule>{
                    category: RuleCategory.Cosmetic,
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
            return <ElementHidingRule>{
                category: RuleCategory.Cosmetic,
                type: CosmeticRuleType.ElementHidingRule,
                syntax,
                exception,
                modifiers,
                domains,
                separator,
                body: ElementHidingBodyParser.parse(rawBody),
            };
        }

        // ADG CSS inject / ABP snippet inject
        else if (CosmeticRuleSeparatorUtils.isAdgCss(separator)) {
            if (CssInjectionBodyParser.isAdgCssInjection(rawBody)) {
                const body = CssInjectionBodyParser.parseAdgCssInjection(rawBody);

                return <CssRule>{
                    category: RuleCategory.Cosmetic,
                    type: CosmeticRuleType.CssRule,
                    syntax: AdblockSyntax.Adg,
                    exception,
                    modifiers,
                    domains,
                    separator,
                    body,
                };
            }

            return <ScriptletRule>{
                category: RuleCategory.Cosmetic,
                type: CosmeticRuleType.ScriptletRule,
                syntax: AdblockSyntax.Abp,
                exception,
                modifiers,
                domains,
                separator,
                body: ScriptletBodyParser.parseAbpSnippetCall(rawBody),
            };
        }

        // ADG/uBO scriptlets
        else if (
            CosmeticRuleSeparatorUtils.isAdgScriptlet(separator) ||
            CosmeticRuleSeparatorUtils.isUboScriptlet(separator)
        ) {
            // Set syntax
            syntax = AdblockSyntax.Adg;
            if (CosmeticRuleSeparatorUtils.isUboScriptlet(separator)) {
                syntax = AdblockSyntax.Ubo;
            }

            return <ScriptletRule>{
                category: RuleCategory.Cosmetic,
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
        else if (CosmeticRuleSeparatorUtils.isUboHtml(separator) || CosmeticRuleSeparatorUtils.isAdgHtml(separator)) {
            /**
             * Special case: uBO's responseheader rule. This rule follows the syntax of cosmetic rules,
             * but is only parsed at the network level.
             *
             * @see {@link NetworkRuleParser.parse}
             */
            if (CosmeticRuleSeparatorUtils.isUboHtml(separator) && rawBody.startsWith(UBO_RESPONSEHEADER_INDICATOR)) {
                return null;
            }

            // Set syntax
            if (CosmeticRuleSeparatorUtils.isUboHtml(separator)) {
                syntax = AdblockSyntax.Ubo;
            } else {
                syntax = AdblockSyntax.Adg;
            }

            if (UboModifierListParser.hasUboModifierIndicators(rawBody)) {
                const { modifiers: uboModifiers, rest: uboRest } = UboModifierListParser.parse(rawBody);

                if (uboModifiers.length > 0) {
                    if (CosmeticRuleSeparatorUtils.isAdgHtml(separator)) {
                        throw new SyntaxError(`Cannot use uBO options with ADG HTML filtering`);
                    }

                    if (syntax == AdblockSyntax.Adg || adgModifiers.length > 0) {
                        throw new SyntaxError(`Cannot use AdGuard modifier list with uBO options`);
                    }

                    modifiers.push(...uboModifiers);

                    syntax = AdblockSyntax.Ubo;
                    rawBody = uboRest;
                }
            }

            return <HtmlRule>{
                category: RuleCategory.Cosmetic,
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
        else if (CosmeticRuleSeparatorUtils.isAdgJs(separator)) {
            return <JsRule>{
                category: RuleCategory.Cosmetic,
                type: CosmeticRuleType.JsRule,
                syntax: AdblockSyntax.Adg,
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
     * @param ast - Cosmetic rule AST
     * @returns Raw string
     */
    public static generate(ast: CosmeticRule): string {
        let result = EMPTY;

        // AdGuard modifiers
        if (ast.syntax == AdblockSyntax.Adg && ast.modifiers.length > 0) {
            result += AdgModifierListParser.generate({
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

                if (ast.syntax == AdblockSyntax.Ubo && ast.modifiers.length > 0) {
                    result += UboModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: ElementHidingBodyParser.generate(<ElementHidingRuleBody>ast.body),
                    });
                } else {
                    result += ElementHidingBodyParser.generate(<ElementHidingRuleBody>ast.body);
                }
                break;

            case CosmeticRuleType.CssRule:
                result += ast.separator;

                if (ast.syntax == AdblockSyntax.Ubo && ast.modifiers.length > 0) {
                    result += UboModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: CssInjectionBodyParser.generate(<CssRuleBody>ast.body, ast.syntax),
                    });
                } else {
                    result += CssInjectionBodyParser.generate(<CssRuleBody>ast.body, ast.syntax);
                }
                break;

            case CosmeticRuleType.HtmlRule:
                result += ast.separator;

                if (ast.syntax == AdblockSyntax.Ubo && ast.modifiers.length > 0) {
                    result += UboModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: HtmlBodyParser.generate(<HtmlRuleBody>ast.body, ast.syntax),
                    });
                } else {
                    result += HtmlBodyParser.generate(<HtmlRuleBody>ast.body, ast.syntax);
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
                const scriptlets = ScriptletBodyParser.generate(<ScriptletRuleBody>ast.body, ast.syntax);

                if (ast.syntax == AdblockSyntax.Abp) {
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
