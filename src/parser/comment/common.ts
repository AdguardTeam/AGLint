import { IRule, RuleCategories } from "../common";

/** Represents possible comment markers. */
export enum CommentMarker {
    Regular = "!",
    Hashmark = "#",
}

/** Represents possible comment categories. */
export enum CommentRuleType {
    Comment = "Comment",
    Metadata = "Metadata",
    Agent = "Agent",
    Hint = "Hint",
    PreProcessor = "PreProcessor",
    ConfigComment = "ConfigComment",
}

/**
 * Represents the basic comment rule interface.
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
 *  - AGLint inline config comments:
 *      - ```adblock
 *        ! aglint-enable some-rule
 *        ```
 *      - ```adblock
 *        ! aglint-disable some-rule
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
export interface IComment extends IRule {
    category: RuleCategories.Comment;
    type: CommentRuleType;
}
