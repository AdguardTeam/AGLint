import { CommentParser } from "./comment/comment";
import { IComment } from "./comment/common";
import { RuleCategories } from "./common";
import { CosmeticRuleParser, ICosmeticRule } from "./cosmetic/cosmetic";
import { INetworkRule, NetworkRuleParser } from "./network/network";

export class RuleParser {
    public static parse(rawRule: string) {
        // Comments (agent / metadata / hint / pre-processor / comment)
        const comment = CommentParser.parse(rawRule);
        if (comment !== null) {
            return comment;
        }

        // Cosmetic rules / non-basic rules
        const cosmetic = CosmeticRuleParser.parse(rawRule);
        if (cosmetic !== null) {
            return cosmetic;
        }

        // Network / basic rules
        const network = NetworkRuleParser.parse(rawRule);

        return network;
    }

    public static generate(ast: IComment | ICosmeticRule | INetworkRule) {
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
