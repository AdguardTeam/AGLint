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
    /** Syntax of the adblock rule (if cannot be determined then the value is `Unknown`) */
    syntax: AdblockSyntax;

    /** Category of the adblock rule (should be always present) */
    category: RuleCategory;

    /** Type of the adblock rule (should be always present) */
    type: string;
}

/**
 * Represents an "empty rule" (practically an empty line)
 */
export interface EmptyRule extends Rule {
    type: typeof EMPTY_RULE_TYPE;
}

/**
 * `RuleParser` is responsible for parsing the rules.
 *
 * It automatically determines the category and syntax of the rule, so you can pass any kind of rule to it.
 */
export class RuleParser {
    /**
     * Parse an adblock rule. The type and syntax of the rule is determined automatically if possible.
     *
     * @param raw - Raw adblock rule
     * @returns Adblock rule AST
     * @throws If the input matches a pattern but syntactically invalid
     */
    public static parse(raw: string): AnyRule {
        const trimmed = raw.trim();

        // Empty lines / rules
        if (trimmed.length == 0) {
            return {
                syntax: AdblockSyntax.Unknown,
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
