import { Rule, RuleCategory } from '../common';
import { CommentRuleType } from './types';

/**
 * Represents the basic comment rule interface.
 */
export interface Comment extends Rule {
    category: RuleCategory.Comment;
    type: CommentRuleType;
}
