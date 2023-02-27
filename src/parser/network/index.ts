import { AdblockSyntax } from '../../utils/adblockers';
import { REGEX_MARKER } from '../../utils/string';
import { RuleModifier, ModifierListParser, MODIFIER_LIST_TYPE } from '../common/modifier-list';
import { NetworkRuleType } from './types';
import {
    ASSIGN_OPERATOR, CLOSE_PARENTHESIS, EMPTY, ESCAPE_CHARACTER, OPEN_PARENTHESIS,
} from '../../utils/constants';
import { CosmeticRuleSeparator, CosmeticRuleSeparatorUtils } from '../../utils/cosmetic-rule-separator';
import { Rule, RuleCategory } from '../common';

const NETWORK_RULE_EXCEPTION_MARKER = '@@';
const NETWORK_RULE_EXCEPTION_MARKER_LEN = NETWORK_RULE_EXCEPTION_MARKER.length;
const NETWORK_RULE_SEPARATOR = '$';

const UBO_RESPONSEHEADER = 'responseheader';
const ADG_REMOVEHEADER = 'removeheader';
export const UBO_RESPONSEHEADER_INDICATOR = UBO_RESPONSEHEADER + OPEN_PARENTHESIS;
const UBO_RESPONSEHEADER_INDICATOR_LEN = UBO_RESPONSEHEADER_INDICATOR.length;

/**
 * Represents any network rule
 */
export type AnyNetworkRule = BasicNetworkRule | RemoveHeaderNetworkRule;

/**
 * Represents the common properties of network rules
 */
export interface NetworkRule extends Rule {
    category: RuleCategory.Network;
    type: NetworkRuleType;
    syntax: AdblockSyntax;

    /**
     * If the rule is an exception rule. If the rule begins with `@@`, it means that it is an exception rule.
     *
     * @example
     * The following rule is an exception rule:
     * ```adblock
     * @@||example.org^
     * ```
     * since it begins with `@@`, which is the exception marker.
     *
     * But the following rule is not an exception rule:
     * ```adblock
     * ||example.org^
     * ```
     * since it does not begins with `@@`.
     */
    exception: boolean;

    /**
     * The rule pattern.
     *
     * @example
     * - Let's say we have the following rule:
     *   ```adblock
     *   ||example.org^
     *   ```
     *   then the pattern of this rule is `||example.org^`.
     * - But let's say we have the following rule:
     *   ```adblock
     *   ||example.org^$third-party,script
     *   ```
     *   then the pattern of this rule is also `||example.org^`.
     */
    pattern: string;
}

/**
 * Represents a network filtering rule. Also known as "basic rule".
 *
 * @example
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
export interface BasicNetworkRule extends NetworkRule {
    type: NetworkRuleType.BasicNetworkRule;

    /**
     * The rule modifiers.
     *
     * @example
     * - Let's say we have the following rule:
     *   ```adblock
     *   ||example.org^$third-party
     *   ```
     *   then the modifiers of this rule are `["third-party"]`.
     */
    modifiers: RuleModifier[];
}

/**
 * Represents a header remover network filtering rule.
 *
 * @example
 * Example rules:
 *   - ```adblock
 *     ||example.org^$removeheader=header-name
 *     ```
 *   - ```adblock
 *     example.org##^responseheader(header-name)
 *     ```
 */
export interface RemoveHeaderNetworkRule extends NetworkRule {
    type: NetworkRuleType.RemoveHeaderNetworkRule;
    syntax: AdblockSyntax;

    /**
     * The name of the header to remove.
     */
    header: string;
}

/**
 * `NetworkRuleParser` is responsible for parsing network rules.
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
     * @param raw - Raw rule
     * @returns Network rule AST
     */
    public static parse(raw: string): AnyNetworkRule {
        let rule = raw.trim();

        // Special case
        const uboRemoveHeader = NetworkRuleParser.parseUboResponseHeader(raw);
        if (uboRemoveHeader) {
            return uboRemoveHeader;
        }

        const common: NetworkRule = {
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            // Initially, the entire rule is considered a pattern
            pattern: rule,
        };

        // Rule starts with exception marker, eg @@||example.com
        if (rule.indexOf(NETWORK_RULE_EXCEPTION_MARKER) === 0) {
            common.exception = true;
            rule = rule.substring(NETWORK_RULE_EXCEPTION_MARKER_LEN);
            common.pattern = rule;
        }

        // Find corresponding (last) separator
        const separatorIndex = NetworkRuleParser.findNetworkRuleSeparatorIndex(rule);

        // Get rule parts
        const modifiers: RuleModifier[] = [];

        if (separatorIndex !== -1) {
            common.pattern = rule.substring(0, separatorIndex);

            modifiers.push(...ModifierListParser.parse(rule.substring(separatorIndex + 1)).modifiers);

            // Special network rules
            if (modifiers.length === 1 && modifiers[0].modifier === ADG_REMOVEHEADER) {
                const header = modifiers[0].value;

                if (!header || header.length === 0) {
                    throw new SyntaxError(`No header name specified in rule "${raw}"`);
                }

                common.type = NetworkRuleType.RemoveHeaderNetworkRule;
                common.syntax = AdblockSyntax.Adg;

                return <RemoveHeaderNetworkRule>{
                    ...common,
                    header,
                };
            }
        }

        return <BasicNetworkRule>{
            ...common,
            modifiers,
        };
    }

    /**
     * Finds the index of the separator character in a network rule.
     *
     * @param rule Network rule to check
     * @returns The index of the separator character, or -1 if there is no separator
     */
    private static findNetworkRuleSeparatorIndex(rule: string): number {
        // As we are looking for the last separator, we start from the end of the string
        for (let i = rule.length - 1; i >= 0; i -= 1) {
            // If we find a potential separator, we should check
            // - if it's not escaped
            // - if it's not followed by a regex marker, for example: `example.org^$removeparam=/regex$/`
            // eslint-disable-next-line max-len
            if (rule[i] === NETWORK_RULE_SEPARATOR && rule[i + 1] !== REGEX_MARKER && rule[i - 1] !== ESCAPE_CHARACTER) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Parses a uBlock Origin response header filtering rule.
     *
     * uBO calls this rule a "special case of HTML filtering", so this follows uBO's HTML filtering
     * syntax, which is a cosmetic pattern. However, we only parse this rule in the network parser.
     *
     * @param raw - Raw uBO response header filtering rule
     * @returns
     * AST of the parsed rule, or null if there is no response header filtering indicator in the raw input
     * @throws If the response header indicator is present, but the rule is syntactically invalid
     * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#response-header-filtering}
     */
    private static parseUboResponseHeader(raw: string): RemoveHeaderNetworkRule | null {
        const trimmed = raw.trim();

        // In order to operate quickly, we only check the presence of the indicator at first
        if (trimmed.indexOf(UBO_RESPONSEHEADER_INDICATOR) === -1) {
            return null;
        }

        // Although this is a network rule, it follows the syntax of cosmetic rules, so it is an exotic case
        const [start, end, separator, exception] = CosmeticRuleSeparatorUtils.find(trimmed);

        if (
            start === -1
            || !(separator === CosmeticRuleSeparator.UboHtml || separator === CosmeticRuleSeparator.UboHtmlException)
        ) {
            throw new SyntaxError('uBO responseheader filtering requires a valid uBO HTML rule separator');
        }

        const body = trimmed.substring(end).trim();

        if (!body.startsWith(UBO_RESPONSEHEADER_INDICATOR)) {
            throw new SyntaxError(
                `uBO responseheader filtering rule body must be start with "${UBO_RESPONSEHEADER_INDICATOR}"`,
            );
        }

        if (!body.endsWith(CLOSE_PARENTHESIS)) {
            throw new SyntaxError(`uBO responseheader filtering rule body must be end with "${CLOSE_PARENTHESIS}"`);
        }

        const header = body.slice(UBO_RESPONSEHEADER_INDICATOR_LEN, -1).trim();

        if (header.length === 0) {
            throw new SyntaxError(`No header name specified in rule "${trimmed}"`);
        }

        return {
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Ubo,
            exception: !!exception,
            pattern: trimmed.substring(0, start).trim(),
            header,
        };
    }

    /**
     * Converts the AST of a header removal network rule to a string.
     *
     * @param ast - Header remover rule AST
     * @returns Raw string
     */
    private static generateUboResponseHeader(ast: RemoveHeaderNetworkRule): string {
        let result = EMPTY;

        result += ast.pattern;
        result += ast.exception ? CosmeticRuleSeparator.UboHtmlException : CosmeticRuleSeparator.UboHtml;
        result += UBO_RESPONSEHEADER_INDICATOR;
        result += ast.header;
        result += CLOSE_PARENTHESIS;

        return result;
    }

    /**
     * Converts a network rule (basic rule) AST to a string.
     *
     * @param ast - Network rule AST
     * @returns Raw string
     */
    public static generate(ast: AnyNetworkRule): string {
        let result = EMPTY;

        // Special case
        if (ast.type === NetworkRuleType.RemoveHeaderNetworkRule && ast.syntax === AdblockSyntax.Ubo) {
            return NetworkRuleParser.generateUboResponseHeader(<RemoveHeaderNetworkRule>ast);
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

            default:
                throw new Error('Unknown network rule type');
        }

        return result;
    }
}
