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

        it('handles multiple problems at the exact same position with disable-all', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule2'),
                createProblem(2, 5, 'rule3'),
            ]);

            // All problems at the same position should be disabled
            expect(filtered).toHaveLength(0);
        });

        it('handles multiple problems at the same position with specific rule disable', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule1'), // Duplicate at same position
                createProblem(2, 5, 'rule2'),
            ]);

            // Both rule1 problems should be disabled, rule2 should remain
            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('rule2');
        });

        it('handles multiple problems at same position with disable-next-line', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.DisableNextLine, 1, 0),
            ]);

            const filtered = applier.filter([
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule2'),
                createProblem(2, 5, 'rule3'),
            ]);

            // All problems on line 2 should be disabled
            expect(filtered).toHaveLength(0);
        });

        it('handles multiple same-rule problems at same position', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule1'),
            ]);

            // All three instances of rule1 at the same position should be disabled
            expect(filtered).toHaveLength(0);
        });

        it('handles multiple problems at same position with directive at exact same position', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 2, 5),
            ]);

            const filtered = applier.filter([
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule2'),
                createProblem(2, 5, 'rule3'),
            ]);

            // With sameLineTakesEffect=true (default), all should be disabled
            expect(filtered).toHaveLength(0);
        });

        it('handles multiple problems at same position when some should be kept', () => {
            const applier = new LinterInlineDisableApplier([
                createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1'),
                createDirective(LinterConfigCommentType.Disable, 1, 5, 'rule2'),
            ]);

            const filtered = applier.filter([
                createProblem(2, 5, 'rule1'),
                createProblem(2, 5, 'rule2'),
                createProblem(2, 5, 'rule3'),
                createProblem(2, 5, 'rule1'), // Duplicate
            ]);

            // Only rule3 should remain
            expect(filtered).toHaveLength(1);
            expect(filtered[0]?.ruleId).toBe('rule3');
        });
    });

    describe('filterWithUnusedDirectives', () => {
        describe('unused disable-all directives', () => {
            it('detects completely unused disable-all', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 2, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(1, 0, 'rule1'), // Before directive, not suppressed
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directive);
                expect(result.unusedDirectives[0]?.unusedRuleIds).toBeUndefined();
            });

            it('detects used disable-all', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'), // After directive, suppressed
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('marks disable-all as used when suppressing multiple rules', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'),
                    createProblem(3, 0, 'rule2'),
                    createProblem(4, 0, 'rule3'),
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });
        });

        describe('unused specific rule directives', () => {
            it('detects completely unused specific rule disable', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule2'), // Different rule, not suppressed
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directive);
                expect(result.unusedDirectives[0]?.unusedRuleIds).toEqual(['rule1']);
            });

            it('detects used specific rule disable', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'), // Same rule, suppressed
                    createProblem(3, 0, 'rule2'), // Different rule, not suppressed
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.problems[0]?.ruleId).toBe('rule2');
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('detects unused when rule appears before directive', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 5, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'), // Before directive
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.unusedRuleIds).toEqual(['rule1']);
            });
        });

        describe('unused disable-next-line directives', () => {
            it('detects completely unused disable-next-line all', () => {
                const directive = createDirective(LinterConfigCommentType.DisableNextLine, 2, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'), // Same line
                    createProblem(4, 0, 'rule2'), // Two lines after
                ]);

                expect(result.problems).toHaveLength(2);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directive);
            });

            it('detects used disable-next-line all', () => {
                const directive = createDirective(LinterConfigCommentType.DisableNextLine, 2, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(3, 0, 'rule1'), // Next line
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('detects unused disable-next-line specific rule', () => {
                const directive = createDirective(LinterConfigCommentType.DisableNextLine, 2, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(3, 0, 'rule2'), // Next line, different rule
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.unusedRuleIds).toEqual(['rule1']);
            });

            it('detects used disable-next-line specific rule', () => {
                const directive = createDirective(LinterConfigCommentType.DisableNextLine, 2, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(3, 0, 'rule1'), // Next line, same rule
                    createProblem(3, 5, 'rule2'), // Next line, different rule
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.problems[0]?.ruleId).toBe('rule2');
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('detects unused when no problems on next line', () => {
                const directive = createDirective(LinterConfigCommentType.DisableNextLine, 2, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
            });
        });

        describe('multiple directives', () => {
            it('distinguishes between used and unused directives', () => {
                const directive1 = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const directive2 = createDirective(LinterConfigCommentType.Disable, 1, 5, 'rule2');
                const directive3 = createDirective(LinterConfigCommentType.Disable, 1, 10, 'rule3');
                const applier = new LinterInlineDisableApplier([directive1, directive2, directive3]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'), // Suppressed by directive1
                    createProblem(3, 0, 'rule3'), // Suppressed by directive3
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directive2);
                expect(result.unusedDirectives[0]?.unusedRuleIds).toEqual(['rule2']);
            });

            it('handles mix of disable-all and specific rules', () => {
                const directiveAll = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const directiveSpecific = createDirective(LinterConfigCommentType.Disable, 5, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directiveAll, directiveSpecific]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'),
                    createProblem(3, 0, 'rule2'),
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directiveSpecific);
            });

            it('handles consecutive disable-next-line with some unused', () => {
                const directive1 = createDirective(LinterConfigCommentType.DisableNextLine, 1, 0, 'rule1');
                const directive2 = createDirective(LinterConfigCommentType.DisableNextLine, 2, 0, 'rule2');
                const directive3 = createDirective(LinterConfigCommentType.DisableNextLine, 3, 0, 'rule3');
                const applier = new LinterInlineDisableApplier([directive1, directive2, directive3]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'), // Suppressed by directive1
                    createProblem(4, 0, 'rule3'), // Suppressed by directive3
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directive2);
            });
        });

        describe('enable directives', () => {
            it('does not report enable directives as unused', () => {
                const disable = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const enable = createDirective(LinterConfigCommentType.Enable, 5, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([disable, enable]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'),
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('does not report unused enable even without matching disable', () => {
                const enable = createDirective(LinterConfigCommentType.Enable, 5, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([enable]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'),
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(0);
            });
        });

        describe('edge cases with unused tracking', () => {
            it('handles empty problems with unused directives', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
            });

            it('handles no directives', () => {
                const applier = new LinterInlineDisableApplier();

                const result = applier.filterWithUnusedDirectives([
                    createProblem(1, 0, 'rule1'),
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('handles problems without ruleId', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0), // No ruleId
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('specific rule disable does not suppress problems without ruleId', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0), // No ruleId, not suppressed
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.unusedDirectives).toHaveLength(1);
            });

            it('preserves problem order in result', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 3, 0, 'rule2');
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(5, 0, 'rule1'),
                    createProblem(1, 0, 'rule3'),
                    createProblem(4, 0, 'rule2'), // This will be suppressed
                ]);

                expect(result.problems).toHaveLength(2);
                expect(result.problems[0]?.position.start.line).toBe(1);
                expect(result.problems[1]?.position.start.line).toBe(5);
                expect(result.unusedDirectives).toHaveLength(0);
            });
        });

        describe('fatal problems with unused tracking', () => {
            it('marks directive as unused when fatal problems are kept', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const applier = new LinterInlineDisableApplier([directive]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1', true), // Fatal, kept due to keepFatal=true
                ]);

                expect(result.problems).toHaveLength(1);
                expect(result.problems[0]?.fatal).toBe(true);
                // Directive is unused because it didn't actually suppress the fatal problem
                expect(result.unusedDirectives).toHaveLength(1);
            });

            it('counts fatal problems as suppressed when keepFatal=false', () => {
                const directive = createDirective(LinterConfigCommentType.Disable, 1, 0);
                const applier = new LinterInlineDisableApplier([directive], { keepFatal: false });

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1', true), // Fatal, suppressed
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });
        });

        describe('complex scenarios', () => {
            it('handles disable-enable cycles with partial usage', () => {
                const disable1 = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const enable1 = createDirective(LinterConfigCommentType.Enable, 5, 0, 'rule1');
                const disable2 = createDirective(LinterConfigCommentType.Disable, 10, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([disable1, enable1, disable2]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(3, 0, 'rule1'), // Suppressed by disable1
                    createProblem(12, 0, 'rule1'), // Suppressed by disable2
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(0);
            });

            it('detects unused in disable-enable-disable chain', () => {
                const disable1 = createDirective(LinterConfigCommentType.Disable, 1, 0, 'rule1');
                const enable1 = createDirective(LinterConfigCommentType.Enable, 5, 0, 'rule1');
                const disable2 = createDirective(LinterConfigCommentType.Disable, 10, 0, 'rule1');
                const applier = new LinterInlineDisableApplier([disable1, enable1, disable2]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(3, 0, 'rule1'), // Suppressed by disable1
                    // No problems after line 10, so disable2 is unused
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(disable2);
            });

            it('handles multiple disable-next-line on same line', () => {
                const directive1 = createDirective(LinterConfigCommentType.DisableNextLine, 1, 0, 'rule1');
                const directive2 = createDirective(LinterConfigCommentType.DisableNextLine, 1, 5, 'rule2');
                const applier = new LinterInlineDisableApplier([directive1, directive2]);

                const result = applier.filterWithUnusedDirectives([
                    createProblem(2, 0, 'rule1'),
                    // rule2 problem missing, so directive2 is unused
                ]);

                expect(result.problems).toHaveLength(0);
                expect(result.unusedDirectives).toHaveLength(1);
                expect(result.unusedDirectives[0]?.directive).toBe(directive2);
            });
        });
    });
});
