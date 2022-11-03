import { CommentParser } from "./comment/comment";
import { IComment } from "./comment/common";
import { RuleCategories } from "./common";
import {
    CosmeticRuleParser,
    ICosmeticRule,
    ICssRule,
    IElementHidingRule,
    IHtmlRule,
    IJsRule,
    IScriptletRule,
} from "./cosmetic/cosmetic";
import { INetworkRule, NetworkRuleParser } from "./network/network";

export class RuleParser {
    /**
     * Parse an adblock rule. The type and syntax of the rule is determined automatically if possible.
     *
     * @param {string} raw - Raw rule
     * @returns {IComment | ICssRule | IElementHidingRule | IScriptletRule | IHtmlRule | IJsRule | INetworkRule}
     * Network rule AST
     */
    public static parse(
        raw: string
    ): IComment | ICssRule | IElementHidingRule | IScriptletRule | IHtmlRule | IJsRule | INetworkRule {
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
     * @param {INetworkRule} ast - Adblock rule AST
     * @returns {string} Raw string
     */
    public static generate(ast: IComment | ICosmeticRule | INetworkRule): string {
        switch (ast.category) {
            case RuleCategories.Comment:
                return CommentParser.generate(ast);
            case RuleCategories.Cosmetic:
                return CosmeticRuleParser.generate(ast);
            case RuleCategories.Network:
                return NetworkRuleParser.generate(ast);
        }
    }
}
