import { describe, expect, it } from 'vitest';

import { applyFixes } from '../../../src/linter/source-code/fix-applier';
import { type LinterFixCommand } from '../../../src/linter/source-code/fix-generator';

const fix = (start: number, end: number, text: string): LinterFixCommand => ({
    range: [start, end],
    text,
});

describe('applyFixes', () => {
    it('empty fix list: unchanged output, no applied/remaining', () => {
        const input = 'abcdef';

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, []);

        expect(fixedSource).toBe(input);
        expect(appliedFixes).toEqual([]);
        expect(remainingFixes).toEqual([]);
    });

    it('simple replacement in the middle', () => {
        const input = 'abcdef';

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [
            fix(2, 4, 'XY'), // 'cd' -> 'XY'
        ]);

        expect(fixedSource).toBe('abXYef');
        expect(appliedFixes).toHaveLength(1);
        expect(remainingFixes).toHaveLength(0);
    });

    it('insertion at the beginning and the end', () => {
        const input = 'abc';

        const { fixedSource } = applyFixes(input, [
            fix(0, 0, '['), // beginning
            fix(input.length, input.length, ']'), // end
        ]);

        expect(fixedSource).toBe('[abc]');
    });

    it('deletion (empty text)', () => {
        const input = 'a-b-c';

        const { fixedSource } = applyFixes(input, [
            fix(1, 2, ''), // delete '-'
            fix(3, 4, ''), // delete the other '-'
        ]);

        expect(fixedSource).toBe('abc');
    });

    it('multiple non-overlapping fixes (left to right)', () => {
        const input = 'The quick brown fox';

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [
            fix(4, 9, 'fast'), // 'quick' -> 'fast'
            fix(10, 15, 'red'), // 'brown' -> 'red'
            fix(16, 19, 'wolf'), // 'fox' -> 'wolf'
        ]);

        expect(fixedSource).toBe('The fast red wolf');
        expect(appliedFixes).toHaveLength(3);
        expect(remainingFixes).toHaveLength(0);
    });

    it('multiple non-overlapping fixes from unsorted input (sorting works)', () => {
        const input = 'abcd efgh ijkl';

        const { fixedSource, appliedFixes } = applyFixes(input, [
            fix(5, 9, 'EFGH'), // 'efgh' -> 'EFGH'
            fix(0, 4, 'ABCD'), // 'abcd' -> 'ABCD' (given out of order)
            fix(10, 14, 'IJKL'),
        ]);

        expect(fixedSource).toBe('ABCD EFGH IJKL');
        expect(appliedFixes.map((f) => f.range)).toEqual([[0, 4], [5, 9], [10, 14]]);
    });

    it('adjacent fixes (end == next.start) both are applied', () => {
        const input = 'ab';

        const { fixedSource } = applyFixes(input, [
            fix(0, 1, 'A'),
            fix(1, 2, 'B'),
        ]);

        expect(fixedSource).toBe('AB');
    });

    it('multiple insertions at the same position (deterministic order by input)', () => {
        const input = 'abcd';

        // both insert at [1,1]; the order in input should be preserved
        const f1 = fix(1, 1, 'X');
        const f2 = fix(1, 1, 'Y');

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [f1, f2]);

        // Expected: both insertions go before index 1 sequentially
        // 'a' + 'X' + 'Y' + 'bcd' = 'aXYbcd'
        expect(fixedSource).toBe('aXYbcd');
        expect(appliedFixes).toEqual([f1, f2]);
        expect(remainingFixes).toHaveLength(0);
    });

    it('overlapping fixes: later (overlapping) one goes to remaining', () => {
        const input = 'abcdef';

        const f1 = fix(1, 3, 'X'); // 'bc' -> 'X'
        const f2 = fix(2, 4, 'Y'); // 'cd' -> 'Y' (overlaps with previous)

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [f1, f2]);

        // Expected: only f1 applied
        expect(fixedSource).toBe('aXdef');
        expect(appliedFixes).toEqual([f1]);
        expect(remainingFixes).toEqual([f2]);
    });

    it('early insertion + later insertion (offset drift regression test)', () => {
        const input = 'abcd';

        // If we shifted later fix by offset, it would drift.
        // Using original coordinates, expected result:
        // insert at [1,1] => aXbcd
        // insert at [3,3] (original index) => aXbcYd
        const { fixedSource } = applyFixes(input, [
            fix(1, 1, 'X'),
            fix(3, 3, 'Y'),
        ]);

        expect(fixedSource).toBe('aXbcYd');
    });

    it('entire file replacement [0, len] → new content', () => {
        const input = 'hello\nworld';

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [
            fix(0, input.length, 'replaced'),
        ]);

        expect(fixedSource).toBe('replaced');
        expect(appliedFixes).toHaveLength(1);
        expect(remainingFixes).toHaveLength(0);
    });

    it('combination of insertion and deletion', () => {
        const input = 'foo_bar_baz';

        const { fixedSource } = applyFixes(input, [
            // 1) delete the first '_'
            fix(3, 4, ''),
            // 2) replace the second '_' with '-' → originally [7,8]
            fix(7, 8, '-'),
            // 3) add surrounding brackets
            fix(0, 0, '['),
            fix(input.length, input.length, ']'),
        ]);

        expect(fixedSource).toBe('[foobar-baz]');
    });

    it('fix at the end: insertion at string length', () => {
        const input = 'abc';

        const { fixedSource } = applyFixes(input, [
            fix(3, 3, '!'),
        ]);

        expect(fixedSource).toBe('abc!');
    });

    it('fix at the start: insertion at 0 index', () => {
        const input = 'xyz';

        const { fixedSource } = applyFixes(input, [
            fix(0, 0, '>'),
        ]);

        expect(fixedSource).toBe('>xyz');
    });

    it('complex, non-overlapping, mixed operations', () => {
        const input = 'int main() { return 0; }';

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [
            // 'int' -> 'void'
            fix(0, 3, 'void'),
            // space after '{' -> '\n   '
            fix(12, 13, '\n   '),
            // 'return 0' (13..21) -> '42'
            fix(13, 21, '42'),
            // newline before '}'
            fix(23, 23, '\n'),
        ]);

        expect(fixedSource).toBe('void main() {\n   42; \n}');
        expect(appliedFixes).toHaveLength(4);
        expect(remainingFixes).toHaveLength(0);
    });

    it('overlap detection among multiple fixes: only the first remains', () => {
        const input = '1234567890';

        const f1 = fix(2, 6, 'AA'); // '3456' -> 'AA'
        const f2 = fix(4, 8, 'BB'); // '5678' -> 'BB' (overlaps with f1)
        const f3 = fix(8, 10, 'CC'); // '90' -> 'CC' (does not overlap f1)

        const { fixedSource, appliedFixes, remainingFixes } = applyFixes(input, [f1, f2, f3]);

        expect(fixedSource).toBe('12AA78CC'); // f2 skipped, f3 applied
        expect(appliedFixes).toEqual([f1, f3]);
        expect(remainingFixes).toEqual([f2]);
    });
});
