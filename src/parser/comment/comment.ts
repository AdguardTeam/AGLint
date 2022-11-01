import { StringUtils } from "../../utils/string";
import { CosmeticRuleSeparatorUtils } from "../../utils/cosmetic-rule-separator";
import { CommentMarker, CommentRuleType, IComment } from "./common";
import { AgentParser, IAgent } from "./agent";
import { HintParser, IHint } from "./hint";
import { IMetadata, MetadataParser } from "./metadata";
import { IPreProcessor, PreProcessorParser } from "./preprocessor";
import { RuleCategories } from "../common";
import { AdblockSyntax } from "../../utils/adblockers";

export interface ISimpleComment extends IComment {
    type: CommentRuleType.Comment;
    marker: CommentMarker;
    text: string;
}

export class CommentParser {
    /**
     * Determines whether a rule is a regular comment.
     *
     * @param {string} raw
     * @returns {boolean} true/false
     */
    public static isRegularComment(raw: string): boolean {
        return raw[0] == CommentMarker.Regular;
    }

    /**
     * Determines whether a rule is a comment.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean}
     */
    public static isComment(raw: string): boolean {
        // Regular comments
        if (CommentParser.isRegularComment(raw)) {
            return true;
        }

        // Hashmark based comments
        else if (raw[0] == CommentMarker.Hashmark) {
            const [start, end] = CosmeticRuleSeparatorUtils.find(raw);

            // No separator
            if (start == -1) {
                return true;
            } else {
                // No valid selector
                if (
                    !raw[end + 1] ||
                    StringUtils.isWhitespace(raw[end + 1]) ||
                    (raw[end + 1] == CommentMarker.Hashmark &&
                        raw[end + 2] == CommentMarker.Hashmark)
                ) {
                    return true;
                }
            }
        }

        // Agents
        return AgentParser.isAgent(raw);
    }

    public static parse(raw: string) {
        if (!CommentParser.isComment(raw)) {
            return null;
        }

        return (
            AgentParser.parse(raw) ||
            HintParser.parse(raw) ||
            PreProcessorParser.parse(raw) ||
            MetadataParser.parse(raw) ||
            <IComment>{
                syntax: AdblockSyntax.Unknown,
                category: RuleCategories.Comment,
                type: CommentRuleType.Comment,
                marker: raw[0],
                text: raw.substring(1),
            }
        );
    }

    /**
     * Converts AST to String.
     *
     * @param {IAgent} ast
     * @returns {string} Raw data
     */
    public static generate(ast: IComment): string {
        switch (ast.type) {
            case CommentRuleType.Agent:
                return AgentParser.generate(<IAgent>ast);
            case CommentRuleType.Hint:
                return HintParser.generate(<IHint>ast);
            case CommentRuleType.PreProcessor:
                return PreProcessorParser.generate(<IPreProcessor>ast);
            case CommentRuleType.Metadata:
                return MetadataParser.generate(<IMetadata>ast);
            case CommentRuleType.Comment:
                return (<ISimpleComment>ast).marker + (<ISimpleComment>ast).text;
        }
    }
}
