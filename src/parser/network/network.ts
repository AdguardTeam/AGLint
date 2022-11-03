import { AdblockSyntax } from "../../utils/adblockers";
import { StringUtils } from "../../utils/string";
import { IRuleModifier, ModifierListParser } from "../common/modifier-list";
import { IRule, RuleCategories } from "../common";

const NETWORK_RULE_EXCEPTION_MARKER = "@@";
const NETWORK_RULE_EXCEPTION_MARKER_LEN = 2;
const NETWORK_RULE_SEPARATOR = "$";
const REGEX_PATTERN_MARKER = "/";

export interface INetworkRule extends IRule {
    category: RuleCategories.Network;
    type: "NetworkRule";
    syntax: AdblockSyntax;
    regex: boolean;
    exception: boolean;
    pattern: string;
    modifiers: IRuleModifier[];
}

export class NetworkRuleParser {
    public static parse(raw: string): INetworkRule {
        let rule = raw.trim();

        const result: INetworkRule = {
            type: "NetworkRule",
            category: RuleCategories.Network,
            syntax: AdblockSyntax.Unknown,
            regex: false,
            exception: false,
            // Initially, the entire rule is considered a pattern
            pattern: rule,
            modifiers: [],
        };

        // Rule starts with exception marker, eg @@||example.com
        if (rule.indexOf(NETWORK_RULE_EXCEPTION_MARKER) == 0) {
            result.exception = true;
            rule = rule.substring(NETWORK_RULE_EXCEPTION_MARKER_LEN);
            result.pattern = rule;
        }

        // Find corresponding (last) separator
        // Handle these issues:
        //  /ad.js$m1=/v1/
        //  example.com$m1,m2=/^regex$/
        const separatorIndex = StringUtils.findLastUnescapedCharacterThatNotFollowedBy(
            rule,
            NETWORK_RULE_SEPARATOR,
            REGEX_PATTERN_MARKER
        );

        // Get rule parts
        if (separatorIndex != -1) {
            result.pattern = rule.substring(0, separatorIndex);

            result.modifiers = ModifierListParser.parse(rule.substring(separatorIndex + 1)).modifiers;
        }

        // Pattern starts with / and ends with /
        if (StringUtils.isRegexPattern(result.pattern)) {
            result.regex = true;
        }

        return result;
    }

    /**
     * Converts AST to String.
     *
     * @param {INetworkRule} ast - Network rule AST
     * @returns {string} Raw data
     */
    public static generate(ast: INetworkRule): string {
        let result = "";

        if (ast.exception) {
            result += NETWORK_RULE_EXCEPTION_MARKER;
        }

        result += ast.pattern;

        if (ast.modifiers.length > 0) {
            result += NETWORK_RULE_SEPARATOR;

            result += ModifierListParser.generate({
                type: "ModifierList",
                modifiers: ast.modifiers,
            });
        }

        return result;
    }
}
