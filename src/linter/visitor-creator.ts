import { type LinterRuleVisitors } from './rule';
import { type Visitor } from './source-code/visitor-collection';

/**
 * Helper to create visitors for any network rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any network rule.
 */
export const createVisitorsForAnyNetworkRule = (visitor: Visitor): LinterRuleVisitors => {
    return {
        NetworkRule: visitor,
        HostRule: visitor,
    };
};

/**
 * Helper to create exit visitors for any network rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Exit visitors for any network rule.
 */
export const createExitVisitorsForAnyNetworkRule = (visitor: Visitor): LinterRuleVisitors => {
    return {
        'NetworkRule:exit': visitor,
        'HostRule:exit': visitor,
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
 * Helper to create exit visitors for any cosmetic rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Exit visitors for any cosmetic rule.
 */
export const createExitVisitorsForAnyCosmeticRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        'CssInjectionRule:exit': visitor,
        'ElementHidingRule:exit': visitor,
        'ScriptletInjectionRule:exit': visitor,
        'HtmlFilteringRule:exit': visitor,
        'JsInjectionRule:exit': visitor,
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
 * Helper to create exit visitors for any comment rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Exit visitors for any comment rule.
 */
export const createExitVisitorsForAnyCommentRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        'AgentCommentRule:exit': visitor,
        'CommentRule:exit': visitor,
        'ConfigCommentRule:exit': visitor,
        'HintCommentRule:exit': visitor,
        'MetadataCommentRule:exit': visitor,
        'PreProcessorCommentRule:exit': visitor,
    };
};

/**
 * Helper to create visitors for any valid rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Visitors for any valid rule.
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
 * Helper to create exit visitors for any valid rule.
 *
 * @param visitor The visitor to use.
 *
 * @returns Exit visitors for any valid rule.
 */
export const createExitVisitorsForAnyValidRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        ...createExitVisitorsForAnyNetworkRule(visitor),
        ...createExitVisitorsForAnyCosmeticRule(visitor),
        ...createExitVisitorsForAnyCommentRule(visitor),
    };
};

/**
 * Helper to create visitors for any rule (including invalid and empty rules).
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

/**
 * Helper to create exit visitors for any rule (including invalid and empty rules).
 *
 * @param visitor The visitor to use.
 *
 * @returns Exit visitors for any rule.
 */
export const createExitVisitorsForAnyRule = (
    visitor: Visitor,
): LinterRuleVisitors => {
    return {
        ...createExitVisitorsForAnyNetworkRule(visitor),
        ...createExitVisitorsForAnyCosmeticRule(visitor),
        ...createExitVisitorsForAnyCommentRule(visitor),
        'InvalidRule:exit': visitor,
        'EmptyRule:exit': visitor,
    };
};
