import { IRule, RuleCategories } from "../common";

export enum CommentMarker {
    Regular = "!",
    Hashmark = "#",
}

export enum CommentRuleType {
    Comment = "Comment",
    Metadata = "Metadata",
    Agent = "Agent",
    Hint = "Hint",
    PreProcessor = "PreProcessor",
}

export interface IComment extends IRule {
    category: RuleCategories.Comment;
    type: CommentRuleType;
}
