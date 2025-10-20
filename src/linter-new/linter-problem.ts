import { type LinterRuleSeverity, type LinterRuleType } from './rule';
import { type LinterFixCommand } from './source-code/fix-generator';
import { type LinterPositionRange } from './source-code/source-code';

export type LinterSuggestion = {
    fix: LinterFixCommand;
    message: string;
    messageId?: string;
    data?: Record<string, unknown>;
};

/**
 * Represents a problem given by the linter.
 */
export type LinterProblem = {
    /**
     * The category of this problem.
     */
    category?: LinterRuleType;

    /**
     * Name of the linter rule that generated this problem.
     */
    ruleId?: string;

    message: string;

    messageId?: string;

    data?: Record<string, unknown>;

    /**
     * The severity of this problem.
     */
    severity: LinterRuleSeverity;

    /**
     * Whether this problem is fatal.
     * This value can be set only by the linter core for fatal errors,
     * like parse errors.
     */
    fatal?: boolean;

    /**
     * The location of the problem.
     */
    position: LinterPositionRange;

    /**
     * Fix command that can be applied to fix this problem.
     */
    fix?: LinterFixCommand;

    /**
     * Suggestions that can be applied to fix this problem.
     */
    suggestions?: LinterSuggestion[];
};
