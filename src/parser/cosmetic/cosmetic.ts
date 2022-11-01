import { IRule, RuleCategories } from "../common";

// Utils
import {
    CosmeticRuleSeparator,
    CosmeticRuleSeparatorUtils,
} from "../../utils/cosmetic-rule-separator";
import { AdblockSyntax } from "../../utils/adblockers";

// Parsers
import { CommentParser } from "../comment/comment";
import { CssInjectionBodyParser, ICssRuleBody } from "./body/css";
import { ElementHidingBodyParser, IElementHidingRuleBody } from "./body/elementhiding";
import { ScriptletBodyParser, IScriptletRuleBody } from "./body/scriptlet";
import { HtmlBodyParser, IHtmlRuleBody } from "./body/html";
import { DomainListParser, IDomain } from "../common/domain-list";
import { AdGuardModifierListParser } from "./specific/adg-options";
import { IRuleModifier } from "../common/modifier-list";
import { uBlockModifierListParser } from "./specific/ubo-options";
import { CosmeticRuleType } from "./common";

export interface ICosmeticRule extends IRule {
    category: RuleCategories.Cosmetic;
    type: CosmeticRuleType;
    modifiers: IRuleModifier[];
    domains: IDomain[];
    separator: CosmeticRuleSeparator;
    exception: boolean;
    body: unknown;
}

export interface IElementHidingRule extends ICosmeticRule {
    type: CosmeticRuleType.ElementHidingRule;
    body: IElementHidingRuleBody;
}

export interface ICssRule extends ICosmeticRule {
    type: CosmeticRuleType.CssRule;
    body: ICssRuleBody;
}

export interface IScriptletRule extends ICosmeticRule {
    type: CosmeticRuleType.ScriptletRule;
    body: IScriptletRuleBody;
}

export interface IHtmlRule extends ICosmeticRule {
    type: CosmeticRuleType.HtmlRule;
    body: IHtmlRuleBody;
}

export interface IJsRule extends ICosmeticRule {
    type: CosmeticRuleType.JsRule;
    body: string;
}

export class CosmeticRuleParser {
    public static isCosmetic(rawRule: string) {
        if (CommentParser.isComment(rawRule)) {
            return false;
        }

        const [start] = CosmeticRuleSeparatorUtils.find(rawRule);

        return start != -1;
    }

    /**
     * Parses a cosmetic rule. The structure of the cosmetic rules:
     *  - pattern
     *  - separator
     *  - body
     *
     * @param {string} rawRule - Raw cosmetic rule
     * @returns {IElementHidingRule | ICssRule | IScriptletRule | IHtmlRule | IJsRule | null} Parsed cosmetic rule AST or null if it failed to parse based on the known cosmetic rules
     */
    public static parse(rawRule: string) {
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
        const { modifiers: adgModifiers, rest: adgRest } =
            AdGuardModifierListParser.parse(rawPattern);

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
            const { modifiers: uboModifiers, rest: uboRest } =
                uBlockModifierListParser.parse(rawBody);

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
                    throw new SyntaxError(
                        `Cannot use AdGuard modifier list with uBO's CSS injection`
                    );
                }

                syntax = AdblockSyntax.uBlockOrigin;

                const body = CssInjectionBodyParser.parseUblockCssInjection(rawBody);

                if (!body) {
                    throw new SyntaxError(`Invalid uBlock CSS injection: "${rawBody}"`);
                }

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

                if (!body) {
                    throw new SyntaxError(`Invalid AdGuard CSS injection: "${rawBody}"`);
                }

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
            let syntax: AdblockSyntax = AdblockSyntax.AdGuard;
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
            if (
                CosmeticRuleSeparatorUtils.isUblockHtml(separator) &&
                rawBody.startsWith("responseheader(")
            ) {
                return null;
            }

            // Set syntax
            let syntax: AdblockSyntax = AdblockSyntax.AdGuard;
            if (CosmeticRuleSeparatorUtils.isUblockScriptlet(separator)) {
                syntax = AdblockSyntax.uBlockOrigin;
            }

            const { modifiers: uboModifiers, rest: uboRest } =
                uBlockModifierListParser.parse(rawBody);

            if (uboModifiers.length > 0) {
                if (syntax == AdblockSyntax.AdGuard) {
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

    public static generate(ast: ICosmeticRule): string {
        let result = "";

        // AdGuard modifiers
        if (ast.syntax == AdblockSyntax.AdGuard && ast.modifiers.length > 0) {
            result += AdGuardModifierListParser.generate({
                type: "AdGuardModifierList",
                modifiers: ast.modifiers,
                rest: "",
            });
        }

        // Domains
        result += DomainListParser.generate({
            type: "DomainList",
            separator: ",",
            domains: ast.domains,
        });

        switch (ast.type) {
            case CosmeticRuleType.ElementHidingRule:
                result += ast.separator;

                if (ast.syntax == AdblockSyntax.uBlockOrigin && ast.modifiers.length > 0) {
                    result += uBlockModifierListParser.generate({
                        type: "uBlockModifierList",
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
                    result += uBlockModifierListParser.generate({
                        type: "uBlockModifierList",
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
                    result += uBlockModifierListParser.generate({
                        type: "uBlockModifierList",
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
                const scriptlets = ScriptletBodyParser.generate(
                    <IScriptletRuleBody>ast.body,
                    ast.syntax
                );

                if (ast.syntax == AdblockSyntax.AdblockPlus) {
                    result += scriptlets.join("; ");
                    return result;
                } else {
                    const rules = [];

                    // Render ADG/uBO rules "separately"
                    for (const scriptlet of scriptlets) {
                        rules.push(result + scriptlet);
                    }

                    return rules.join("\n");
                }
        }

        return result;
    }
}
