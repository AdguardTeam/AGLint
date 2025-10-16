import { LinterConfigCommentType } from './config-comment-type';
import { type LinterProblem } from './linter-problem';
import { type LinterPositionRange } from './source-code/source-code';

export type LinterDisableDirective = {
    command: LinterConfigCommentType;
    position: LinterPositionRange;
    ruleId?: string;
};

export type LinterInlineDisableOptions = {
    keepFatal?: boolean;
    sameLineTakesEffect?: boolean;
};

type Event = {
    line: number;
    column: number;
    kind: 'disable' | 'enable';
    all: boolean;
    ruleId?: string;
};

export class LinterInlineDisableApplier {
    private directives: LinterDisableDirective[] = [];

    private readonly keepFatal: boolean;

    private readonly sameLineTakesEffect: boolean;

    constructor(
        directives: ReadonlyArray<LinterDisableDirective> = [],
        opts: LinterInlineDisableOptions = {},
    ) {
        this.directives = [...directives];
        this.keepFatal = opts.keepFatal ?? true;
        this.sameLineTakesEffect = opts.sameLineTakesEffect ?? true;
    }

    public setDirectives(d: ReadonlyArray<LinterDisableDirective>): this {
        this.directives = [...d];
        return this;
    }

    public addDirective(d: LinterDisableDirective): this {
        this.directives.push(d);
        return this;
    }

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

    /** In-place: the given problems array is modified to contain the filtered problems. */
    public filterInPlace(problems: LinterProblem[]): void {
        const filtered = this.filter(problems);
        // eslint-disable-next-line no-param-reassign
        problems.length = 0;
        problems.push(...filtered);
    }

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

    private static compareProblemPos(a: LinterProblem, b: LinterProblem) {
        const lineDiff = a.position.start.line - b.position.start.line;

        if (lineDiff !== 0) {
            return lineDiff;
        }

        return a.position.start.column - b.position.start.column;
    }
}
