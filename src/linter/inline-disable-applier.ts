import { LinterConfigCommentType } from './config-comment-type';
import { type LinterProblem } from './linter-problem';
import { type LinterPositionRange } from './source-code/source-code';

/**
 * Represents a directive that disables or enables linter rules.
 */
export type LinterDisableDirective = {
    /**
     * The type of directive command.
     */
    command: LinterConfigCommentType;

    /**
     * Position in the source code where the directive appears.
     */
    position: LinterPositionRange;

    /**
     * Optional specific rule to disable/enable.
     * If omitted, applies to all rules.
     */
    ruleId?: string;
};

/**
 * Represents an unused or partially unused disable directive.
 */
export type UnusedDisableDirective = {
    /**
     * The directive that was unused or partially unused.
     */
    directive: LinterDisableDirective;

    /**
     * If the directive specifies specific rules, this contains
     * the rule IDs that were never used to suppress any problems.
     * Undefined if the directive disables all rules and was completely unused.
     */
    unusedRuleIds?: string[];
};

/**
 * Options for controlling inline disable behavior.
 */
export type LinterInlineDisableOptions = {
    /**
     * Whether to keep fatal errors even if disabled.
     * Defaults to true.
     */
    keepFatal?: boolean;

    /**
     * Whether directives on the same line take effect immediately.
     * Defaults to true.
     */
    sameLineTakesEffect?: boolean;
};

type Event = {
    line: number;
    column: number;
    kind: 'disable' | 'enable';
    all: boolean;
    ruleId?: string;
};

/**
 * Filters linter problems based on inline disable/enable directives.
 *
 * This class processes disable directives (like `aglint-disable`, `aglint-enable`,
 * and `aglint-disable-next-line`) to determine which problems should be suppressed.
 *
 * @example
 * ```typescript
 * const applier = new LinterInlineDisableApplier(directives, { keepFatal: true });
 * const filtered = applier.filter(problems);
 * // Returns problems not covered by disable directives
 * ```
 */
export class LinterInlineDisableApplier {
    /**
     * List of disable directives to apply.
     */
    private directives: LinterDisableDirective[] = [];

    /**
     * Whether to preserve fatal errors even if disabled.
     */
    private readonly keepFatal: boolean;

    /**
     * Whether directives on the same line take effect immediately.
     */
    private readonly sameLineTakesEffect: boolean;

    /**
     * Creates a new inline disable applier.
     *
     * @param directives Array of disable/enable directives to process.
     * @param opts Configuration options.
     */
    constructor(
        directives: ReadonlyArray<LinterDisableDirective> = [],
        opts: LinterInlineDisableOptions = {},
    ) {
        this.directives = [...directives];
        this.keepFatal = opts.keepFatal ?? true;
        this.sameLineTakesEffect = opts.sameLineTakesEffect ?? true;
    }

    /**
     * Replaces the current directives with a new set.
     *
     * @param d New array of directives.
     *
     * @returns This instance for chaining.
     */
    public setDirectives(d: ReadonlyArray<LinterDisableDirective>): this {
        this.directives = [...d];
        return this;
    }

    /**
     * Adds a single directive to the collection.
     *
     * @param d Directive to add.
     *
     * @returns This instance for chaining.
     */
    public addDirective(d: LinterDisableDirective): this {
        this.directives.push(d);
        return this;
    }

    /**
     * Filters problems based on disable directives.
     *
     * Returns a new array with problems that should not be suppressed.
     * The original array is not modified.
     *
     * @param problems Problems to filter.
     *
     * @returns New array of problems not covered by disable directives.
     *
     * @example
     * ```typescript
     * const filtered = applier.filter(allProblems);
     * // filtered contains only problems that weren't disabled
     * ```
     */
    public filter(problems: ReadonlyArray<LinterProblem>): LinterProblem[] {
        const { events, nextLineMap } = LinterInlineDisableApplier.buildTimeline(this.directives);

        const sorted = [...problems].sort(LinterInlineDisableApplier.compareProblemPos);

        let allDisabled = false;
        const disabledRules = new Set<string>();
        let eventIndex = 0;

        const res: LinterProblem[] = [];
        for (const problem of sorted) {
            const { line } = problem.position.start;
            const { column } = problem.position.start;

            // apply all events that are before this problem
            while (eventIndex < events.length) {
                const ev = events[eventIndex]!;
                // if sameLineTakesEffect=false, then events on the same line
                // only take effect from the next line
                const beforeThisProblem = ev.line < line
                    || (ev.line === line && (this.sameLineTakesEffect ? ev.column <= column : ev.column < 0));

                if (!beforeThisProblem) {
                    break;
                }

                if (ev.kind === 'disable') {
                    if (ev.all) {
                        allDisabled = true;
                    } else if (ev.ruleId) {
                        disabledRules.add(ev.ruleId);
                    }
                } else if (ev.all) {
                    allDisabled = false;
                    disabledRules.clear();
                } else if (ev.ruleId) {
                    disabledRules.delete(ev.ruleId);
                }

                eventIndex += 1;
            }

            // disable-next-line effect for the actual line
            const nextLine = nextLineMap.get(line);
            const disabledByNextLine = nextLine?.all === true
                || (!!problem.ruleId && nextLine?.rules.has(problem.ruleId));

            // permanent disable
            const disabledByRange = allDisabled || (!!problem.ruleId && disabledRules.has(problem.ruleId));

            const shouldDrop = (!this.keepFatal || !problem.fatal) && (disabledByNextLine || disabledByRange);

            if (!shouldDrop) {
                res.push(problem);
            }
        }

        // restore original order
        res.sort(LinterInlineDisableApplier.compareProblemPos);

        return res;
    }

    /**
     * Filters problems and tracks unused disable directives.
     *
     * Returns both filtered problems and information about directives that
     * were not used or only partially used to suppress problems.
     *
     * @param problems Problems to filter.
     *
     * @returns Object containing filtered problems and unused directives.
     *
     * @example
     * ```typescript
     * const { problems, unusedDirectives } = applier.filterWithUnusedDirectives(allProblems);
     * // problems: filtered problems that weren't disabled
     * // unusedDirectives: directives that didn't suppress anything
     * ```
     */
    public filterWithUnusedDirectives(problems: ReadonlyArray<LinterProblem>): {
        problems: LinterProblem[];
        unusedDirectives: UnusedDisableDirective[];
    } {
        const { events, nextLineMap } = LinterInlineDisableApplier.buildTimeline(this.directives);

        const sorted = [...problems].sort(LinterInlineDisableApplier.compareProblemPos);

        // Track which directives were used
        const usedDirectives = new Map<LinterDisableDirective, Set<string | 'all'>>();
        const directivesByLine = new Map<number, LinterDisableDirective[]>();

        // Map directives to lines for tracking
        for (const directive of this.directives) {
            const { line } = directive.position.start;
            if (!directivesByLine.has(line)) {
                directivesByLine.set(line, []);
            }
            directivesByLine.get(line)!.push(directive);
            usedDirectives.set(directive, new Set());
        }

        let allDisabled = false;
        const disabledRules = new Set<string>();
        let eventIndex = 0;

        const res: LinterProblem[] = [];
        for (const problem of sorted) {
            const { line } = problem.position.start;
            const { column } = problem.position.start;

            // apply all events that are before this problem
            while (eventIndex < events.length) {
                const ev = events[eventIndex]!;
                const beforeThisProblem = ev.line < line
                    || (ev.line === line && (this.sameLineTakesEffect ? ev.column <= column : ev.column < 0));

                if (!beforeThisProblem) {
                    break;
                }

                if (ev.kind === 'disable') {
                    if (ev.all) {
                        allDisabled = true;
                    } else if (ev.ruleId) {
                        disabledRules.add(ev.ruleId);
                    }
                } else if (ev.all) {
                    allDisabled = false;
                    disabledRules.clear();
                } else if (ev.ruleId) {
                    disabledRules.delete(ev.ruleId);
                }

                eventIndex += 1;
            }

            // Check disable-next-line
            const nextLine = nextLineMap.get(line);
            const disabledByNextLine = nextLine?.all === true
                || (!!problem.ruleId && nextLine?.rules.has(problem.ruleId));

            // Check permanent disable
            const disabledByRange = allDisabled || (!!problem.ruleId && disabledRules.has(problem.ruleId));

            const shouldDrop = (!this.keepFatal || !problem.fatal) && (disabledByNextLine || disabledByRange);

            if (shouldDrop) {
                // Track which directive was used
                if (disabledByNextLine) {
                    // Find the disable-next-line directive from the previous line
                    const prevLineDirectives = directivesByLine.get(line - 1) || [];
                    for (const directive of prevLineDirectives) {
                        if (directive.command === LinterConfigCommentType.DisableNextLine) {
                            const used = usedDirectives.get(directive)!;
                            if (directive.ruleId) {
                                if (directive.ruleId === problem.ruleId) {
                                    used.add(problem.ruleId);
                                }
                            } else {
                                used.add('all');
                            }
                        }
                    }
                }

                if (disabledByRange) {
                    // Find the active disable directive(s)
                    // We need to track back through events to find which directive caused the disable
                    for (let i = 0; i < eventIndex; i += 1) {
                        const ev = events[i]!;
                        if (ev.kind === 'disable') {
                            // Find matching directive
                            const lineDirectives = directivesByLine.get(ev.line) || [];
                            for (const directive of lineDirectives) {
                                if (directive.command === LinterConfigCommentType.Disable
                                    && directive.position.start.column === ev.column) {
                                    const used = usedDirectives.get(directive)!;
                                    if (ev.all && allDisabled) {
                                        used.add('all');
                                    } else if (ev.ruleId && problem.ruleId === ev.ruleId) {
                                        used.add(ev.ruleId);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                res.push(problem);
            }
        }

        // Determine unused directives
        const unusedDirectives: UnusedDisableDirective[] = [];
        for (const directive of this.directives) {
            // Only check disable directives, not enable
            if (directive.command === LinterConfigCommentType.Enable) {
                continue;
            }

            const used = usedDirectives.get(directive)!;

            if (directive.ruleId) {
                // Specific rule disable - check if that rule was used
                if (!used.has(directive.ruleId)) {
                    unusedDirectives.push({
                        directive,
                        unusedRuleIds: [directive.ruleId],
                    });
                }
            } else if (used.size === 0) {
                // All rules disabled - check if anything was suppressed
                unusedDirectives.push({
                    directive,
                });
            }
        }

        // Restore original order
        res.sort(LinterInlineDisableApplier.compareProblemPos);

        return {
            problems: res,
            unusedDirectives,
        };
    }

    /**
     * Filters problems in place based on disable directives.
     *
     * Modifies the given problems array directly, removing suppressed problems.
     *
     * @param problems Problems array to filter (modified in place).
     *
     * @example
     * ```typescript
     * const problems = [...];
     * applier.filterInPlace(problems);
     * // problems array now only contains non-disabled problems
     * ```
     */
    public filterInPlace(problems: LinterProblem[]): void {
        const filtered = this.filter(problems);
        // eslint-disable-next-line no-param-reassign
        problems.length = 0;
        problems.push(...filtered);
    }

    /**
     * Builds a timeline of events from disable directives.
     *
     * @param directives Array of disable/enable directives.
     *
     * @returns Object containing events and nextLineMap.
     */
    private static buildTimeline(directives: ReadonlyArray<LinterDisableDirective>) {
        const events: Event[] = [];
        const nextLineMap = new Map<number, { all: boolean; rules: Set<string> }>();

        for (const directive of directives) {
            const { line } = directive.position.start;
            const { column } = directive.position.start;

            switch (directive.command) {
                case LinterConfigCommentType.DisableNextLine: {
                    const target = line + 1;
                    const entry = nextLineMap.get(target) ?? {
                        all: false,
                        rules: new Set<string>(),
                    };

                    if (directive.ruleId) {
                        entry.rules.add(directive.ruleId);
                    } else {
                        entry.all = true;
                    }

                    nextLineMap.set(target, entry);
                    break;
                }

                case LinterConfigCommentType.Disable: {
                    events.push({
                        line,
                        column,
                        kind: 'disable',
                        all: !directive.ruleId,
                        ruleId: directive.ruleId,
                    });
                    break;
                }

                case LinterConfigCommentType.Enable: {
                    events.push({
                        line,
                        column,
                        kind: 'enable',
                        all: !directive.ruleId,
                        ruleId: directive.ruleId,
                    });

                    break;
                }
                default:
                    break;
            }
        }

        events.sort((a, b) => (a.line - b.line) || (a.column - b.column));

        return {
            events,
            nextLineMap,
        };
    }

    /**
     * Compares the positions of two problems.
     *
     * @param a First problem.
     * @param b Second problem.
     *
     * @returns A negative number if the first problem is before the second,
     *          a positive number if the first problem is after the second,
     *          or zero if they are at the same position.
     */
    private static compareProblemPos(a: LinterProblem, b: LinterProblem) {
        const lineDiff = a.position.start.line - b.position.start.line;

        if (lineDiff !== 0) {
            return lineDiff;
        }

        return a.position.start.column - b.position.start.column;
    }
}
