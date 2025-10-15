import { type LinterRuleSeverity, type WithMessages } from './rule';
import { type LinterFixCommand } from './source-code/fixer';
import { type LinterPositionRange } from './source-code/source-code';

type SuggestionBase = {
    fix: LinterFixCommand;
};

type LinterSuggestion = WithMessages<SuggestionBase>;

/**
 * Represents a problem given by the linter.
 */
type LinterProblemBase = {
    /**
     * Name of the linter rule that generated this problem.
     */
    ruleId?: string;

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

export type LinterProblem = WithMessages<LinterProblemBase>;
