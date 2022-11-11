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
}

/** Represents the basic comment rule interface. */
export interface IComment extends IRule {
    category: RuleCategories.Comment;
    type: CommentRuleType;
}
