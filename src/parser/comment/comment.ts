import { StringUtils } from "../../utils/string";
import { CosmeticRuleSeparatorUtils } from "../../utils/cosmetic-rule-separator";
import { CommentMarker, CommentRuleType, IComment } from "./common";
import { AgentParser, IAgent } from "./agent";
import { HintParser, IHint } from "./hint";
import { IMetadata, MetadataParser } from "./metadata";
import { IPreProcessor, PreProcessorParser } from "./preprocessor";
import { RuleCategories } from "../common";
import { AdblockSyntax } from "../../utils/adblockers";

/**
 * Represents a simple comment.
 *
 * Example rules:
 *   - ```adblock
 *     ! This is just a comment
 *     ```
 *   - ```adblock
 *     # This is just a comment
 *     ```
 *   - etc.
 */
export interface ISimpleComment extends IComment {
    type: CommentRuleType.Comment;

    /** Comment marker: `!` or `#` */
    marker: CommentMarker;
    text: string;
}

/**
 * CommentParser is responsible for parsing any comment-like adblock rules.
 *
 * Example rules:
 *  - Agent comments:
 *      - ```adblock
 *        [AdGuard]
 *        ```
 *      - ```adblock
 *        [Adblock Plus 2.0]
 *        ```
 *      - etc.
 *  - AdGuard hints:
 *      - ```adblock
 *        !+ NOT_OPTIMIZED
 *        ```
 *      - ```adblock
 *        !+ NOT_OPTIMIZED PLATFORM(windows)
 *        ```
 *      - etc.
 *  - Pre-processor comments:
 *      - ```adblock
 *        !#if (adguard)
 *        ```
 *      - ```adblock
 *        !#endif
 *        ```
 *      - etc.
 *  - Metadata headers:
 *      - ```adblock
 *        ! Title: My List
 *        ```
 *      - ```adblock
 *        ! Version: 2.0.150
 *        ```
 *      - etc.
 *  - Simple comments:
 *      - ```adblock
 *        ! This is just a comment
 *        ```
 *      - ```adblock
 *        # This is just a comment
 *        ```
 *      - etc.
 */
export class CommentParser {
    /**
     * Determines whether a rule is a regular comment.
     *
     * @param {string} raw - Raw data
     * @returns {boolean} true/false
     */
    public static isRegularComment(raw: string): boolean {
        return raw.trim()[0] == CommentMarker.Regular;
    }

    /**
     * Determines whether a rule is a comment.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean} true/false
     */
    public static isComment(raw: string): boolean {
        const trimmed = raw.trim();

        // Regular comments
        if (CommentParser.isRegularComment(trimmed)) {
            return true;
        }

        // Hashmark based comments
        else if (trimmed[0] == CommentMarker.Hashmark) {
            const [start, end] = CosmeticRuleSeparatorUtils.find(trimmed);

            // No separator
            if (start == -1) {
                return true;
            } else {
                // No valid selector
                if (
                    !trimmed[end + 1] ||
                    StringUtils.isWhitespace(trimmed[end + 1]) ||
                    (trimmed[end + 1] == CommentMarker.Hashmark && trimmed[end + 2] == CommentMarker.Hashmark)
                ) {
                    return true;
                }
            }
        }

        // Agents
        return AgentParser.isAgent(trimmed);
    }

    /**
     * Parses a raw rule as comment.
     *
     * @param {string} raw - Raw rule
     * @returns {IComment | null} Comment AST or null (if the raw rule cannot be parsed as comment)
     */
    public static parse(raw: string): IComment | null {
        const trimmed = raw.trim();

        if (!CommentParser.isComment(trimmed)) {
            return null;
        }

        return (
            AgentParser.parse(trimmed) ||
            HintParser.parse(trimmed) ||
            PreProcessorParser.parse(trimmed) ||
            MetadataParser.parse(trimmed) ||
            <IComment>{
                category: RuleCategories.Comment,
                type: CommentRuleType.Comment,
                syntax: AdblockSyntax.Unknown,
                marker: trimmed[0],
                text: trimmed.substring(1),
            }
        );
    }

    /**
     * Converts a comment AST to a string.
     *
     * @param {IComment} ast - Comment AST
     * @returns {string} Raw string
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
