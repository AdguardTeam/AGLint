import { RuleCategory } from "./categories";
import { AnyCommentRule, CommentParser } from "./comment";
import { AnyCosmeticRule, CosmeticRuleParser } from "./cosmetic";
import { AnyNetworkRule, NetworkRuleParser } from "./network";
import { AdblockSyntax } from "../utils/adblockers";
import { EMPTY } from "../utils/constants";

export const EMPTY_RULE_TYPE = "EmptyRule";

/**
 * Represents any kind of adblock rule.
 */
export type AnyRule = EmptyRule | AnyCommentRule | AnyCosmeticRule | AnyNetworkRule;

/**
 * Specifies the general structure of an adblock rule. This information must
 * be included in all rules, regardless of category.
 */
export interface Rule {
    /**
     * Syntax of the adblock rule (if cannot be clearly determined then the value is `Common`)
     */
    syntax: AdblockSyntax;

    /**
     * Category of the adblock rule (should be always present)
     */
    category: RuleCategory;

    /**
     * Type of the adblock rule (should be always present)
     */
    type: string;
}

/**
 * Represents an "empty rule" (practically an empty line)
 */
export interface EmptyRule extends Rule {
    category: RuleCategory.Empty;

    /**
     * Type of the adblock rule (should be always present)
     */
    type: typeof EMPTY_RULE_TYPE;
}

/**
 * `RuleParser` is responsible for parsing the rules.
 *
 * It automatically determines the category and syntax of the rule, so you can pass any kind of rule to it.
 */
export class RuleParser {
    /**
     * Parse an adblock rule. You can pass any kind of rule to this method, since it will automatically determine
     * the category and syntax. If the rule is syntactically invalid, then an error will be thrown. If the
     * syntax / compatibility cannot be determined clearly, then the value of the `syntax` property will be
     * `Common`.
     *
     * For example, let's have this network rule:
     * ```adblock
     * ||example.org^$important
     * ```
     * The `syntax` property will be `Common`, since the rule is syntactically correct in every adblockers, but we
     * cannot determine at parsing level whether `important` is an existing option or not, nor if it exists, then
     * which adblocker supports it. This is why the `syntax` property is simply `Common` at this point.
     * The concrete COMPATIBILITY of the rule will be determined later, in a different, higher-level layer, called
     * "Compatibility table".
     *
     * But we can determinate the concrete syntax of this rule:
     * ```adblock
     * example.org#%#//scriptlet("scriptlet0", "arg0")
     * ```
     * since it is clearly an AdGuard-specific rule and no other adblockers uses this syntax natively. However, we also
     * cannot determine the COMPATIBILITY of this rule, as it is not clear at this point whether the `scriptlet0`
     * scriptlet is supported by AdGuard or not. This is also the task of the "Compatibility table". Here, we simply
     * mark the rule with the `AdGuard` syntax in this case.
     *
     * @param raw - Raw adblock rule
     * @returns Adblock rule AST
     * @throws If the input matches a pattern but syntactically invalid
     * @example
     * Take a look at the following example:
     * ```js
     * // Parse a network rule
     * const ast1 = RuleParser.parse("||example.org^$important");
     *
     * // Parse another network rule
     * const ast2 = RuleParser.parse("/ads.js^$important,third-party,domain=example.org|~example.com");
     *
     * // Parse a cosmetic rule
     * const ast2 = RuleParser.parse("example.org##.banner");
     *
     * // Parse another cosmetic rule
     * const ast3 = RuleParser.parse("example.org#?#.banner:-abp-has(.ad)");
     *
     * // Parse a comment rule
     * const ast4 = RuleParser.parse("! Comment");
     *
     * // Parse an empty rule
     * const ast5 = RuleParser.parse("");
     *
     * // Parse a comment rule (with metadata)
     * const ast6 = RuleParser.parse("! Title: Example");
     *
     * // Parse a pre-processor rule
     * const ast7 = RuleParser.parse("!#if (adguard)");
     * ```
     */
    public static parse(raw: string): AnyRule {
        const trimmed = raw.trim();

        // Empty lines / rules (handle it just for convenience)
        if (trimmed.length == 0) {
            return {
                syntax: AdblockSyntax.Common,
                category: RuleCategory.Empty,
                type: EMPTY_RULE_TYPE,
            };
        }

        // Comment rules (agent / metadata / hint / pre-processor / comment)
        const comment = CommentParser.parse(trimmed);
        if (comment !== null) {
            return comment;
        }

        // Cosmetic rules / non-basic rules
        const cosmetic = CosmeticRuleParser.parse(trimmed);
        if (cosmetic !== null) {
            return cosmetic;
        }

        // Network / basic rules
        const network = NetworkRuleParser.parse(trimmed);

        return network;
    }

    /**
     * Converts a rule AST to a string.
     *
     * @param ast - Adblock rule AST
     * @returns Raw string
     * @example
     * Take a look at the following example:
     * ```js
     * // Parse the rule to the AST
     * const ast = RuleParser.parse("example.org##.banner");
     * // Generate the rule from the AST
     * const raw = RuleParser.generate(ast);
     * // Print the generated rule
     * console.log(raw); // "example.org##.banner"
     * ```
     */
    public static generate(ast: AnyRule): string {
        switch (ast.category) {
            // Empty lines
            case RuleCategory.Empty:
                return EMPTY;

            // Comment rules
            case RuleCategory.Comment:
                return CommentParser.generate(<AnyCommentRule>ast);

            // Cosmetic / non-basic rules
            case RuleCategory.Cosmetic:
                return CosmeticRuleParser.generate(<AnyCosmeticRule>ast);

            // Network / basic rules
            case RuleCategory.Network:
                return NetworkRuleParser.generate(<AnyNetworkRule>ast);
        }
    }
}
