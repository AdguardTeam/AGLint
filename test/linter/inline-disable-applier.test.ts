import { describe, expect, it } from 'vitest';

import { LinterConfigCommentType } from '../../src/linter/config-comment-type';
import { type LinterDisableDirective, LinterInlineDisableApplier } from '../../src/linter/inline-disable-applier';
import type { LinterProblem } from '../../src/linter/linter-problem';
import type { LinterPositionRange } from '../../src/linter/source-code/source-code';

const createPosition = (line: number, column: number): LinterPositionRange => ({
    start: { line, column },
    end: { line, column },
});

const createProblem = (
    line: number,
    column: number,
    ruleId?: string,
    fatal = false,
): LinterProblem => ({
    ruleId,
    message: 'Test problem',
    position: createPosition(line, column),
    severity: 2,
    fatal,
});

const createDirective = (
    command: LinterConfigCommentType,
    line: number,
    column: number,
    ruleId?: string,
): LinterDisableDirective => ({
    command,
    position: createPosition(line, column),
    ruleId,
});

describe('LinterInlineDisableApplier', () => {
    describe('constructor and setters', () => {
        it('creates instance with default options', () => {
            const applier = new LinterInlineDisableApplier();
            expect(applier).toBeDefined();
        });

        it('creates with directives and options', () => {
            const directives = [createDirective(LinterConfigCommentType.Disable, 1, 0)];
            const applier = new LinterInlineDisableApplier(directives, {
                keepFatal: false,
                sameLineTakesEffect: false,
            });
            expect(applier).toBeDefined();
        });

        it('setDirectives returns this for chaining', () => {
            const applier = new LinterInlineDisableApplier();
            expect(applier.setDirectives([])).toBe(applier);
        });

        it('addDirective returns this for chaining', () => {
            const applier = new LinterInlineDisableApplier();
            expect(applier.addDirective(createDirective(LinterConfigCommentType.Disable, 1, 0))).toBe(applier);
        });
    });

    describe('aglint-disable (all rules)', () => {
        it('disables all rules after comment', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'rule1'),
                createProblem(3, 0, 'rule2'),
            ]);

            expect(filtered).toHaveLength(0);
        });

        it('does not affect problems before comment', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 3, 0),
            ]);

            const filtered = applier.filter([
                createProblem(1, 0, 'rule1'),
                createProblem(2, 0, 'rule2'),
                createProblem(4, 0, 'rule3'),
            ]);

            expect(filtered).toHaveLength(2);
            expect(filtered.map((p) => p.ruleId)).toEqual(['rule1', 'rule2']);
        });

        it('disables problems without ruleId', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0),
                createProblem(3, 0, 'rule1'),
            ]);

            expect(filtered).toHaveLength(0);
        });

        it('handles same line with sameLineTakesEffect=true', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 2, 5),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'r1'),
                createProblem(2, 5, 'r2'),
                createProblem(2, 10, 'r3'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('r1');
        });

        it('handles same line with sameLineTakesEffect=false', () => {
            const applier = new LinterInlineDisableApplier(
                [createDirective(LinterConfigCommentType.Disable, 2, 5)],
                { sameLineTakesEffect: false },
            );

            const filtered = applier.filter([
                createProblem(2, 0, 'r1'),
                createProblem(2, 10, 'r2'),
                createProblem(3, 0, 'r3'),
            ]);

            expect(filtered).toHaveLength(2);
            expect(filtered.map((p) => p.ruleId)).toEqual(['r1', 'r2']);
        });
    });

    describe('aglint-disable (specific rule)', () => {
        it('disables only specified rule', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'rule1'),
                createProblem(3, 0, 'rule2'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('rule2');
        });

        it('handles multiple specific rules', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
                createDirective(LinterConfigCommentType.Disable, 1, 5, 'rule2'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'rule1'),
                createProblem(2, 5, 'rule2'),
                createProblem(2, 10, 'rule3'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('rule3');
        });

        it('does not disable problems without ruleId', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0),
                createProblem(2, 5, 'rule1'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBeUndefined();
        });
    });

    describe('aglint-enable', () => {
        it('re-enables all after disable-all', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
                createDirective(LinterConfigCommentType.Enable, 4, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'r1'),
                createProblem(5, 0, 'r2'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('r2');
        });

        it('re-enables specific rule', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
                createDirective(LinterConfigCommentType.Enable, 4, 0, 'rule1'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'rule1'),
                createProblem(5, 0, 'rule1'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.position.start.line).toBe(5);
        });

        it('enable-all clears all disabled rules', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'r1'),
                createDirective(LinterConfigCommentType.Disable, 1, 5, 'r2'),
                createDirective(LinterConfigCommentType.Enable, 4, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'r1'),
                createProblem(5, 0, 'r2'),
            ]);

            expect(filtered).toHaveLength(1);
        });

        it('handles multiple cycles', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 2, 0),
                createDirective(LinterConfigCommentType.Enable, 4, 0),
                createDirective(LinterConfigCommentType.Disable, 6, 0),
            ]);

            const filtered = applier.filter([
                createProblem(1, 0, 'r1'),
                createProblem(3, 0, 'r2'),
                createProblem(5, 0, 'r3'),
                createProblem(7, 0, 'r4'),
            ]);

            expect(filtered.map((p) => p.ruleId)).toEqual(['r1', 'r3']);
        });

        it('handles enable without prior disable', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Enable, 2, 0),
            ]);

            const filtered = applier.filter([
                createProblem(1, 0, 'r1'),
                createProblem(3, 0, 'r2'),
            ]);

            expect(filtered).toHaveLength(2);
        });

        it('handles enable specific rule without prior disable', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Enable, 2, 0, 'rule1'),
            ]);

            const filtered = applier.filter([
                createProblem(1, 0, 'rule1'),
                createProblem(3, 0, 'rule1'),
            ]);

            expect(filtered).toHaveLength(2);
        });

        it('disables and re-enables specific rule correctly', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'problematic-rule'),
                createDirective(LinterConfigCommentType.Enable, 4, 0, 'problematic-rule'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'problematic-rule'),
                createProblem(3, 0, 'problematic-rule'),
                createProblem(5, 0, 'problematic-rule'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.position.start.line).toBe(5);
            expect(filtered[0]?.ruleId).toBe('problematic-rule');
        });
    });

    describe('aglint-disable-next-line', () => {
        it('disables all rules for next line only', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.DisableNextLine, 2, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'r1'),
                createProblem(3, 0, 'r2'),
                createProblem(4, 0, 'r3'),
            ]);

            expect(filtered.map((p) => p.ruleId)).toEqual(['r1', 'r3']);
        });

        it('disables specific rule for next line', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.DisableNextLine, 2, 0, 'r1'),
            ]);

            const filtered = applier.filter([
                createProblem(3, 0, 'r1'),
                createProblem(3, 5, 'r2'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('r2');
        });

        it('handles multiple rules', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.DisableNextLine, 2, 0, 'r1'),
                createDirective(LinterConfigCommentType.DisableNextLine, 2, 5, 'r2'),
            ]);

            const filtered = applier.filter([
                createProblem(3, 0, 'r1'),
                createProblem(3, 5, 'r2'),
                createProblem(3, 10, 'r3'),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('r3');
        });

        it('handles consecutive disable-next-line directives', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.DisableNextLine, 1, 0),
                createDirective(LinterConfigCommentType.DisableNextLine, 2, 0),
            ]);

            const filtered = applier.filter([
                createProblem(1, 0, 'r1'),
                createProblem(2, 0, 'r2'),
                createProblem(3, 0, 'r3'),
                createProblem(4, 0, 'r4'),
            ]);

            expect(filtered).toHaveLength(2);
            expect(filtered.map((p) => p.ruleId)).toEqual(['r1', 'r4']);
        });

        it('handles disable-next-line all combined with specific rule', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.DisableNextLine, 1, 0),
                createDirective(LinterConfigCommentType.DisableNextLine, 1, 5, 'r1'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'r1'),
                createProblem(2, 5, 'r2'),
            ]);

            expect(filtered).toHaveLength(0);
        });
    });

    describe('fatal problems', () => {
        it('keeps fatal by default', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 0, 'r1', false),
                createProblem(3, 0, 'r2', true),
            ]);

            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.fatal).toBe(true);
        });

        it('removes fatal when keepFatal=false', () => {
            const applier = new LinterInlineDisableApplier(
                [createDirective(LinterConfigCommentType.Disable, 1, 0)],
                { keepFatal: false },
            );

            const filtered = applier.filter([
                createProblem(2, 0, 'r1', true),
            ]);

            expect(filtered).toHaveLength(0);
        });
    });

    describe('filterInPlace', () => {
        it('modifies array in place', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
            ]);

            const problems = [
                createProblem(2, 0, 'r1'),
            ];

            applier.filterInPlace(problems);
            expect(problems).toHaveLength(0);
        });
    });

    describe('edge cases', () => {
        it('handles empty problems', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
            ]);

            expect(applier.filter([])).toHaveLength(0);
        });

        it('handles no directives', () => {
            const applier = new LinterInlineDisableApplier();

            const filtered = applier.filter([
                createProblem(1, 0, 'r1'),
            ]);

            expect(filtered).toHaveLength(1);
        });

        it('handles unsorted problems', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 3, 0),
            ]);

            const filtered = applier.filter([
                createProblem(5, 0, 'r3'),
                createProblem(1, 0, 'r1'),
                createProblem(2, 0, 'r2'),
            ]);

            expect(filtered.map((p) => p.ruleId)).toEqual(['r1', 'r2']);
        });
    });
});
