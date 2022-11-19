import { AdblockSyntax } from "../../utils/adblockers";
import { REGEX_MARKER, StringUtils } from "../../utils/string";
import { IRuleModifier, ModifierListParser, MODIFIER_LIST_TYPE } from "../common/modifier-list";
import { IRule, RuleCategories } from "../common";
import { NetworkRuleType } from "./common";
import { ASSIGN_OPERATOR, CLOSE_PARENTHESIS, EMPTY, OPEN_PARENTHESIS } from "../../utils/constants";
import { CosmeticRuleSeparator, CosmeticRuleSeparatorUtils } from "../../utils/cosmetic-rule-separator";

const NETWORK_RULE_EXCEPTION_MARKER = "@@";
const NETWORK_RULE_EXCEPTION_MARKER_LEN = 2;
const NETWORK_RULE_SEPARATOR = "$";

export const UBO_RESPONSEHEADER_INDICATOR = "responseheader" + OPEN_PARENTHESIS;
const UBO_RESPONSEHEADER_INDICATOR_LEN = 15;
const ADG_REMOVEHEADER = "removeheader";

/**
 * Represents the common properties of network rules
 */
export interface INetworkRule extends IRule {
    category: RuleCategories.Network;
    type: NetworkRuleType;
    syntax: AdblockSyntax;
    exception: boolean;
    pattern: string;
}

/**
 * Represents a network filtering rule. Also known as "basic rule".
 *
 * Example rules:
 *   - ```adblock
 *     /ads.js^$script
 *     ```
 *   - ```adblock
 *     ||example.com^$third-party
 *     ```
 *   - ```adblock
 *     -banner-350px-
 *     ```
 *   - etc.
 */
export interface IBasicNetworkRule extends INetworkRule {
    type: NetworkRuleType.BasicNetworkRule;
    modifiers: IRuleModifier[];
}

/**
 * Represents a header remover network filtering rule.
 *
 * Example rules:
 *   - ```adblock
 *     ||example.org^$removeheader=header-name
 *     ```
 *   - ```adblock
 *     example.org##^responseheader(header-name)
 *     ```
 */
export interface IRemoveHeaderNetworkRule extends INetworkRule {
    type: NetworkRuleType.RemoveHeaderNetworkRule;
    syntax: AdblockSyntax;
    header: string;
}

/**
 * NetworkRuleParser is responsible for parsing network rules.
 *
 * Please note that this will parse all syntactically correct network rules.
 * Modifier compatibility is not checked at the parser level.
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#basic-rules}
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#basic}
 */
export class NetworkRuleParser {
    /**
     * Parses a network rule (also known as basic rule). Make sure you parse the cosmetic rules first!
     *
     * @param {string} raw - Raw rule
     * @returns {INetworkRule} Network rule AST
     */
    public static parse(raw: string): IBasicNetworkRule | IRemoveHeaderNetworkRule {
        let rule = raw.trim();

        // Special case
        const uboRemoveHeader = NetworkRuleParser.parseUboResponseHeader(raw);
        if (uboRemoveHeader) {
            return uboRemoveHeader;
        }

        const common: INetworkRule = {
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            // Initially, the entire rule is considered a pattern
            pattern: rule,
        };

        // Rule starts with exception marker, eg @@||example.com
        if (rule.indexOf(NETWORK_RULE_EXCEPTION_MARKER) == 0) {
            common.exception = true;
            rule = rule.substring(NETWORK_RULE_EXCEPTION_MARKER_LEN);
            common.pattern = rule;
        }

        // Find corresponding (last) separator
        // Handle these issues:
        //  /ad.js$m1=/v1/
        //  example.com$m1,m2=/^regex$/
        const separatorIndex = StringUtils.findNextUnescapedCharacterThatNotFollowedBy(
            rule,
            0,
            NETWORK_RULE_SEPARATOR,
            REGEX_MARKER
        );

        // Get rule parts
        const modifiers: IRuleModifier[] = [];

        if (separatorIndex != -1) {
            common.pattern = rule.substring(0, separatorIndex);

            modifiers.push(...ModifierListParser.parse(rule.substring(separatorIndex + 1)).modifiers);

            // Special network rules
            if (modifiers.length == 1 && modifiers[0].modifier == ADG_REMOVEHEADER) {
                const header = modifiers[0].value;

                if (!header || header.length == 0) {
                    throw new SyntaxError(`No header name specified in rule "${raw}"`);
                }

                common.type = NetworkRuleType.RemoveHeaderNetworkRule;
                common.syntax = AdblockSyntax.AdGuard;

                return <IRemoveHeaderNetworkRule>{
                    ...common,
                    header: modifiers[0].value,
                };
            }
        }

        return <IBasicNetworkRule>{
            ...common,
            modifiers,
        };
    }

    /**
     * Parses a uBlock Origin response header filtering rule.
     *
     * uBO calls this rule a "special case of HTML filtering", so this follows uBO's HTML filtering
     * syntax, which is a cosmetic pattern. However, we only parse this rule in the network parser.
     *
     * @param {string} raw - Raw uBO response header filtering rule
     * @returns {IRemoveHeaderNetworkRule | null}
     * AST of the parsed rule, or null if there is no response header filtering indicator in the raw input
     * @throws If the response header indicator is present, but the rule is syntactically invalid
     * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#response-header-filtering}
     */
    private static parseUboResponseHeader(raw: string): IRemoveHeaderNetworkRule | null {
        const trimmed = raw.trim();

        // In order to operate quickly, we only check the presence of the indicator at first
        if (trimmed.indexOf(UBO_RESPONSEHEADER_INDICATOR) == -1) {
            return null;
        }

        // Although this is a network rule, it follows the syntax of cosmetic rules, so it is an exotic case
        const [start, end, separator, exception] = CosmeticRuleSeparatorUtils.find(trimmed);

        if (
            start == -1 ||
            !(separator == CosmeticRuleSeparator.uBoHTML || separator == CosmeticRuleSeparator.uBoHTMLException)
        ) {
            throw new SyntaxError(`uBO responseheader filtering requires a valid uBO HTML rule separator`);
        }

        const body = trimmed.substring(end).trim();

        if (!body.startsWith(UBO_RESPONSEHEADER_INDICATOR)) {
            throw new SyntaxError(
                `uBO responseheader filtering rule body must be starts with "${UBO_RESPONSEHEADER_INDICATOR}"`
            );
        }

        if (!body.endsWith(CLOSE_PARENTHESIS)) {
            throw new SyntaxError(`uBO responseheader filtering rule body must be ends with "${CLOSE_PARENTHESIS}"`);
        }

        const header = body.slice(UBO_RESPONSEHEADER_INDICATOR_LEN, -1).trim();

        if (header.length == 0) {
            throw new SyntaxError(`No header name specified in rule "${trimmed}"`);
        }

        return {
            category: RuleCategories.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: !!exception,
            pattern: trimmed.substring(0, start).trim(),
            header,
        };
    }

    /**
     * Converts the AST of a header removal network rule to a string.
     *
     * @param {IRemoveHeaderNetworkRule} ast - Header remover rule AST
     * @returns {string} Raw string
     */
    private static generateUboResponseHeader(ast: IRemoveHeaderNetworkRule): string {
        let result = EMPTY;

        result += ast.pattern;
        result += ast.exception ? CosmeticRuleSeparator.uBoHTMLException : CosmeticRuleSeparator.uBoHTML;
        result += UBO_RESPONSEHEADER_INDICATOR;
        result += ast.header;
        result += CLOSE_PARENTHESIS;

        return result;
    }

    /**
     * Converts a network rule (basic rule) AST to a string.
     *
     * @param {INetworkRule} ast - Network rule AST
     * @returns {string} Raw string
     */
    public static generate(ast: IBasicNetworkRule | IRemoveHeaderNetworkRule): string {
        let result = EMPTY;

        // Special case
        if (ast.type == NetworkRuleType.RemoveHeaderNetworkRule && ast.syntax == AdblockSyntax.uBlockOrigin) {
            return NetworkRuleParser.generateUboResponseHeader(<IRemoveHeaderNetworkRule>ast);
        }

        // Common parts
        if (ast.exception) {
            result += NETWORK_RULE_EXCEPTION_MARKER;
        }

        result += ast.pattern;

        // Type-dependent parts
        switch (ast.type) {
            case NetworkRuleType.RemoveHeaderNetworkRule: {
                result += NETWORK_RULE_SEPARATOR;
                result += ADG_REMOVEHEADER;
                result += ASSIGN_OPERATOR;
                result += ast.header;
                break;
            }
            case NetworkRuleType.BasicNetworkRule: {
                if (ast.modifiers.length > 0) {
                    result += NETWORK_RULE_SEPARATOR;

                    result += ModifierListParser.generate({
                        type: MODIFIER_LIST_TYPE,
                        modifiers: ast.modifiers,
                    });
                }
                break;
            }
        }

        return result;
    }
}
