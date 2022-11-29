import { CommentParser } from "./comment/comment";
import { Comment } from "./comment/common";
import { RuleCategory } from "./common";
import {
    CosmeticRuleParser,
    CosmeticRule,
    CssRule,
    ElementHidingRule,
    HtmlRule,
    JsRule,
    ScriptletRule,
} from "./cosmetic/cosmetic";
import { BasicNetworkRule, RemoveHeaderNetworkRule, NetworkRuleParser } from "./network/network";

/**
 * RuleParser is responsible for parsing the rules.
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
    public static parse(
        raw: string
    ):
        | Comment
        | CssRule
        | ElementHidingRule
        | ScriptletRule
        | HtmlRule
        | JsRule
        | BasicNetworkRule
        | RemoveHeaderNetworkRule {
        const trimmed = raw.trim();

        // Comments (agent / metadata / hint / pre-processor / comment)
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
    public static generate(ast: Comment | CosmeticRule | BasicNetworkRule | RemoveHeaderNetworkRule): string {
        switch (ast.category) {
            case RuleCategory.Comment:
                return CommentParser.generate(ast);
            case RuleCategory.Cosmetic:
                return CosmeticRuleParser.generate(ast);
            case RuleCategory.Network:
                return NetworkRuleParser.generate(ast);
        }
    }
}
