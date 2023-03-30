/**
 * @file AGLint entry point
 */

// Parser
export { RuleParser } from './parser/rule';
export {
    AnyOperator,
    AnyExpressionNode,
    AnyRule,
    AnyCommentRule,
    AnyCosmeticRule,
    CommentMarker,
    RuleCategory,
    CommentRuleType,
    CosmeticRuleType,
    CosmeticRuleSeparator,
    Node,
    LocationRange,
    Location,
    Value,
    Parameter,
    ParameterList,
    ExpressionVariableNode,
    ExpressionOperatorNode,
    ExpressionParenthesisNode,
    FilterList,
    RuleBase,
    EmptyRule,
    CommentBase,
    CommentRule,
    MetadataCommentRule,
    ConfigCommentRule,
    PreProcessorCommentRule,
    Agent,
    AgentCommentRule,
    Hint,
    HintCommentRule,
    Modifier,
    ModifierList,
    DomainListSeparator,
    DomainList,
    Domain,
    CssInjectionRuleBody,
    ElementHidingRuleBody,
    ScriptletInjectionRuleBody,
    HtmlFilteringRuleBody,
    CosmeticRule,
    ElementHidingRule,
    CssInjectionRule,
    ScriptletInjectionRule,
    HtmlFilteringRule,
    JsInjectionRule,
    NetworkRule,
} from './parser/common';
export { AgentCommentRuleParser } from './parser/comment/agent-rule';
export { AgentParser } from './parser/comment/agent';
export { HintParser } from './parser/comment/hint';
export { HintCommentRuleParser } from './parser/comment/hint-rule';
export { MetadataCommentRuleParser } from './parser/comment/metadata';
export { PreProcessorCommentRuleParser } from './parser/comment/preprocessor';
export { ConfigCommentRuleParser } from './parser/comment/inline-config';
export { CommentRuleParser } from './parser/comment';
export { NetworkRuleParser } from './parser/network';
export { CosmeticRuleParser } from './parser/cosmetic';
export { LogicalExpressionParser } from './parser/misc/logical-expression';
export { DomainListParser } from './parser/misc/domain-list';
export { ModifierListParser } from './parser/misc/modifier-list';
export { ModifierParser } from './parser/misc/modifier';
export { ParameterListParser } from './parser/misc/parameter-list';
export { AdblockSyntaxError } from './parser/errors/adblock-syntax-error';
export { FilterListParser } from './parser/filterlist';

// Utils
export { DomainUtils } from './utils/domain';
export { VariableTable, LogicalExpressionUtils } from './utils/logical-expression';

// Core linter
export {
    LinterResult,
    LinterProblem,
    LinterRuleData,
    Linter,
} from './linter';

export {
    LinterRuleConfigObject,
    LinterConfig,
    LinterRuleConfigArray,
    LinterRuleConfigMeta,
    LinterRuleMeta,
    LinterRuleEvents,
    LinterRule,
    GenericRuleContext,
    LinterPosition,
    LinterProblemReport,
    LinterRuleStorage,
} from './linter/common';

// Linter CLI
export { LinterCli } from './linter/cli';
export { parseConfigFile } from './linter/cli/config-reader';
export { LinterCliReporter } from './linter/cli/reporter';
export { LinterConsoleReporter } from './linter/cli/reporters/console';
export { ScannedDirectory, scan } from './linter/cli/scan';
export { WalkEvent, walk } from './linter/cli/walk';
