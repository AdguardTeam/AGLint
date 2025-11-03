import { type LinterRuleVisitors } from './rule';
import { type Visitor } from './source-code/visitor-collection';

/**
 * Helper to create visitors for any network rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any network rule.
 */
export const createVisitorsForAnyNetworkRule = (visitor: Visitor) => {
    return {
        NetworkRule: visitor,
        HostRule: visitor,
    };
};

/**
 * Helper to create visitors for any cosmetic rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any cosmetic rule.
 */
export const createVisitorsForAnyCosmeticRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        CssInjectionRule: visitor,
        ElementHidingRule: visitor,
        ScriptletInjectionRule: visitor,
        HtmlFilteringRule: visitor,
        JsInjectionRule: visitor,
    };
};

/**
 * Helper to create visitors for any comment rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any comment rule.
 */
export const createVisitorsForAnyCommentRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        AgentCommentRule: visitor,
        CommentRule: visitor,
        ConfigCommentRule: visitor,
        HintCommentRule: visitor,
        MetadataCommentRule: visitor,
        PreProcessorCommentRule: visitor,
    };
};

/**
 * Helper to create visitors for any rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any rule.
 */
export const createVisitorsForAnyValidRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        ...createVisitorsForAnyNetworkRule(visitor),
        ...createVisitorsForAnyCosmeticRule(visitor),
        ...createVisitorsForAnyCommentRule(visitor),
    };
};

/**
 * Helper to create visitors for any rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any rule.
 */
export const createVisitorsForAnyRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        ...createVisitorsForAnyNetworkRule(visitor),
        ...createVisitorsForAnyCosmeticRule(visitor),
        ...createVisitorsForAnyCommentRule(visitor),
        InvalidRule: visitor,
        EmptyRule: visitor,
    };
};
