import { Rule, RuleCategory } from "../common";

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

/** Represents the basic comment rule interface. */
export interface Comment extends Rule {
    category: RuleCategory.Comment;
    type: CommentRuleType;
}
