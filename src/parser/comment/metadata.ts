/**
 * Metadata comments
 */

import { METADATA_HEADERS } from "../../converter/metadata";
import { AdblockSyntax } from "../../utils/adblockers";
import { SPACE } from "../../utils/constants";
import { RuleCategory } from "../categories";
import { CommentRuleType } from "./types";
import { CommentMarker } from "./marker";
import { Comment } from ".";

const METADATA_SEPARATOR = ":";

/**
 * Represents a metadata comment rule. This is a special comment that specifies
 * the name and value of the metadata header.
 *
 * @example
 * For example, in the case of
 * ```adblock
 * ! Title: My List
 * ```
 * the name of the header is `Title`, and the value is `My List`.
 */
export interface Metadata extends Comment {
    category: RuleCategory.Comment;
    type: CommentRuleType.Metadata;

    /**
     * Comment marker.
     */
    marker: string;

    /**
     * Metadata header name.
     */
    header: string;

    /**
     * Metadata header value (always should present).
     */
    value: string;
}

/**
 * `MetadataParser` is responsible for parsing metadata comments.
 * Metadata comments are special comments that specify some properties of the list.
 *
 * @example
 * For example, in the case of
 * ```adblock
 * ! Title: My List
 * ```
 * the name of the header is `Title`, and the value is `My List`, which means that
 * the list title is `My List`, and it can be used in the adblocker UI.
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#special-comments}
 */
export class MetadataParser {
    /**
     * Parses a raw rule as a metadata comment.
     *
     * @param raw - Raw rule
     * @returns Metadata comment AST or null (if the raw rule cannot be parsed as a metadata comment)
     */
    public static parse(raw: string): Metadata | null {
        const trimmed = raw.trim();

        if (trimmed[0] == CommentMarker.Regular || trimmed[0] == CommentMarker.Hashmark) {
            const commentText = trimmed.substring(1);
            const separatorIndex = commentText.indexOf(METADATA_SEPARATOR);

            if (separatorIndex != -1) {
                const header = commentText.substring(0, separatorIndex).trim();
                const headerLower = header.toLocaleLowerCase();
                for (let i = 0; i < METADATA_HEADERS.length; i++) {
                    if (headerLower === METADATA_HEADERS[i].toLocaleLowerCase()) {
                        return {
                            category: RuleCategory.Comment,
                            type: CommentRuleType.Metadata,
                            syntax: AdblockSyntax.Common,
                            marker: trimmed[0],
                            header,
                            value: commentText.substring(separatorIndex + 1).trim(),
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Converts a metadata comment AST to a string.
     *
     * @param ast - Metadata comment AST
     * @returns Raw string
     */
    public static generate(ast: Metadata): string {
        let result = ast.marker + SPACE;

        result += ast.header;
        result += METADATA_SEPARATOR + SPACE;
        result += ast.value;

        return result;
    }
}
