// Utils
import { CosmeticRuleSeparator, CosmeticRuleSeparatorUtils } from '../../utils/cosmetic-rule-separator';
import { AdblockSyntax } from '../../utils/adblockers';

// Parsers
import { CommentParser } from '../comment';
import { CssInjectionBodyParser, CssRuleBody } from './body/css';
import { ElementHidingBodyParser, ElementHidingRuleBody } from './body/elementhiding';
import { ScriptletBodyParser, ScriptletRuleBody } from './body/scriptlet';
import { HtmlBodyParser, HtmlRuleBody } from './body/html';
import { DomainListParser, DOMAIN_LIST_TYPE, Domain } from '../misc/domain-list';
import { AdgModifierListParser, ADG_MODIFIER_LIST_TYPE } from './specific/adg-modifiers';
import { RuleModifier } from '../misc/modifier-list';
import { UboModifier, UboModifierListParser, UBO_MODIFIER_LIST_TYPE } from './specific/ubo-modifiers';
import { CosmeticRuleType } from './types';
import {
    COMMA, EMPTY, NEWLINE, SEMICOLON, SPACE,
} from '../../utils/constants';
import { UBO_RESPONSEHEADER_INDICATOR } from '../network';
import { Rule, RuleCategory } from '../common';

/**
 * A generic representation of a cosmetic rule.
 */
export type AnyCosmeticRule = CssRule | ElementHidingRule | ScriptletRule | HtmlRule | JsRule;

/**
 * A generic representation of a cosmetic rule.
 *
 * Regarding the categories, there is only a difference in the body,
 * all other properties can be defined at this level.
 */
export interface CosmeticRule extends Rule {
    category: RuleCategory.Cosmetic;
    type: CosmeticRuleType;

    /**
     * List of modifiers.
     */
    modifiers: RuleModifier[] | UboModifier[];

    /**
     * List of domains.
     */
    domains: Domain[];

    /**
     * Separator between pattern and body. For example, in the following rule:
     * ```adblock
     * example.com##.ads
     * ```
     * then the separator is `##`.
     */
    separator: CosmeticRuleSeparator;

    /**
     * If the rule is an exception. For example, in the following rule:
     * ```adblock
     * example.com#@#.ads
     * ```
     * then the rule is an exception and @ is the exception marker.
     */
    exception: boolean;

    /**
     * Body of the rule. It can be a CSS rule, an element hiding rule, a scriptlet rule, etc.
     */
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
 * `CosmeticRuleParser` is responsible for parsing cosmetic rules.
 *
 * Where possible, it automatically detects the difference between supported syntaxes:
 *  - AdGuard
 *  - uBlock Origin
 *  - Adblock Plus
 *
 * If the syntax is common / cannot be determined, the parser gives `Common` syntax.
 *
 * Please note that syntactically correct rules are parsed even if they are not actually
 * compatible with the given adblocker. This is a completely natural behavior, meaningful
 * checking of compatibility is not done at the parser level.
 */
export class CosmeticRuleParser {
    /**
     * Determines whether a rule is a cosmetic rule. The rule is considered cosmetic if it
     * contains a cosmetic rule separator.
     *
     * @param raw - Raw rule
     * @returns `true` if the rule is a cosmetic rule, `false` otherwise
     */
    public static isCosmetic(raw: string) {
        const trimmed = raw.trim();

        if (CommentParser.isComment(trimmed)) {
            return false;
        }

        const [start] = CosmeticRuleSeparatorUtils.find(trimmed);

        return start !== -1;
    }

    /**
     * Parses a cosmetic rule. The structure of the cosmetic rules:
     *  - pattern (modifiers + domains in the case of AdGuard)
     *  - separator
     *  - body
     *
     * @param raw - Raw cosmetic rule
     * @returns
     * Parsed cosmetic rule AST or null if it failed to parse based on the known cosmetic rules
     * @throws If the input matches the cosmetic rule pattern but syntactically invalid
     */
    public static parse(raw: string): AnyCosmeticRule | null {
        // Skip regular comments
        if (CommentParser.isRegularComment(raw)) {
            return null;
        }

        // Find separator (every cosmetic rule has a separator)
        const [start, end, separator, exception] = CosmeticRuleSeparatorUtils.find(raw);

        // If there is no separator, it is not a cosmetic rule
        if (!separator) {
            return null;
        }

        // Find main structural elements
        let rawPattern = raw.substring(0, start).trim();
        let rawBody = raw.substring(end).trim();

        // The syntax is initially common
        let syntax = AdblockSyntax.Common;

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
                    if (syntax === AdblockSyntax.Adg) {
                        throw new SyntaxError('Cannot use AdGuard modifier list with uBO modifiers');
                    }

                    modifiers.push(...uboModifiers);

                    syntax = AdblockSyntax.Ubo;
                    rawBody = uboRest;
                }
            }

            if (CssInjectionBodyParser.isUboCssInjection(rawBody)) {
                if (syntax === AdblockSyntax.Adg) {
                    throw new SyntaxError('Cannot use AdGuard modifier list with uBO\'s CSS injection');
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
        if (CosmeticRuleSeparatorUtils.isAdgCss(separator)) {
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
        if (
            CosmeticRuleSeparatorUtils.isAdgScriptlet(separator)
            || CosmeticRuleSeparatorUtils.isUboScriptlet(separator)
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
        if (CosmeticRuleSeparatorUtils.isUboHtml(separator) || CosmeticRuleSeparatorUtils.isAdgHtml(separator)) {
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
                        throw new SyntaxError('Cannot use uBO modifiers with ADG HTML filtering');
                    }

                    if (syntax === AdblockSyntax.Adg || adgModifiers.length > 0) {
                        throw new SyntaxError('Cannot use AdGuard modifier list with uBO modifiers');
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
        if (CosmeticRuleSeparatorUtils.isAdgJs(separator)) {
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
    public static generate(ast: AnyCosmeticRule): string {
        let result = EMPTY;

        // AdGuard modifiers
        if (ast.syntax === AdblockSyntax.Adg && ast.modifiers.length > 0) {
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

                if (ast.syntax === AdblockSyntax.Ubo && ast.modifiers.length > 0) {
                    result += UboModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: ElementHidingBodyParser.generate(ast.body),
                    });
                } else {
                    result += ElementHidingBodyParser.generate(ast.body);
                }
                break;

            case CosmeticRuleType.CssRule:
                result += ast.separator;

                if (ast.syntax === AdblockSyntax.Ubo && ast.modifiers.length > 0) {
                    result += UboModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: CssInjectionBodyParser.generate(ast.body, ast.syntax),
                    });
                } else {
                    result += CssInjectionBodyParser.generate(ast.body, ast.syntax);
                }
                break;

            case CosmeticRuleType.HtmlRule:
                result += ast.separator;

                if (ast.syntax === AdblockSyntax.Ubo && ast.modifiers.length > 0) {
                    result += UboModifierListParser.generate({
                        type: UBO_MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                        rest: HtmlBodyParser.generate(ast.body, ast.syntax),
                    });
                } else {
                    result += HtmlBodyParser.generate(ast.body, ast.syntax);
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
                const scriptlets = ScriptletBodyParser.generate(ast.body, ast.syntax);

                if (ast.syntax === AdblockSyntax.Abp) {
                    result += scriptlets.join(SEMICOLON + SPACE);
                    return result;
                }

                // Render ADG/uBO rules "separately"
                return scriptlets.map((scriptlet) => result + scriptlet).join(NEWLINE);

            default:
                throw new Error('Unknown cosmetic rule type');
        }

        return result;
    }
}
