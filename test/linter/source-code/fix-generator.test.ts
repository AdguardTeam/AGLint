import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { type LinterFixCommand, LinterFixGenerator } from '../../../src/linter/source-code/fix-generator';

const EMPTY = '';

vi.mock('../../common/constants', () => ({ EMPTY }));

vi.mock('../../utils/type-guards', () => ({
    isNull: (value: unknown) => value === null,
}));

// Minimal mock for LinterSourceCode
class MockLinterSourceCode {
    constructor(private readonly validRanges: Array<[number, number]> = []) {}

    public isRangeValid(range: [number, number]): boolean {
        return this.validRanges.some(([start, end]) => range[0] >= start && range[1] <= end);
    }
}

describe('LinterFixGenerator', () => {
    let mockSourceCode: MockLinterSourceCode;
    let generator: LinterFixGenerator;

    beforeEach(() => {
        mockSourceCode = new MockLinterSourceCode([[0, 100]]);
        generator = new LinterFixGenerator(mockSourceCode as any);
    });

    describe('insertTextBefore', () => {
        it('creates insertTextBefore command at the start offset', () => {
            const result = generator.insertTextBefore([10, 20], 'Hello ');
            expect(result).toEqual<LinterFixCommand>({
                range: [10, 10],
                text: 'Hello ',
            });
        });

        it('returns null for insertTextBefore when range is invalid', () => {
            const invalidSource = new MockLinterSourceCode([[0, 5]]);
            const invalidGenerator = new LinterFixGenerator(invalidSource as any);
            expect(invalidGenerator.insertTextBefore([10, 20], 'Test')).toBeNull();
        });
    });

    describe('insertTextAfter', () => {
        it('creates insertTextAfter command at the end offset', () => {
            const result = generator.insertTextAfter([10, 20], ' World');
            expect(result).toEqual<LinterFixCommand>({
                range: [20, 20],
                text: ' World',
            });
        });

        it('returns null for insertTextAfter when range is invalid', () => {
            const invalidSource = new MockLinterSourceCode([[0, 5]]);
            const invalidGenerator = new LinterFixGenerator(invalidSource as any);
            expect(invalidGenerator.insertTextAfter([15, 30], 'oops')).toBeNull();
        });
    });

    describe('replaceWithText', () => {
        it('creates replaceWithText command for valid range', () => {
            const result = generator.replaceWithText([0, 5], 'XYZ');
            expect(result).toEqual<LinterFixCommand>({
                range: [0, 5],
                text: 'XYZ',
            });
        });

        it('returns null for replaceWithText with invalid range', () => {
            const invalidSource = new MockLinterSourceCode([[10, 15]]);
            const invalidGenerator = new LinterFixGenerator(invalidSource as any);
            expect(invalidGenerator.replaceWithText([0, 5], 'Invalid')).toBeNull();
        });
    });

    describe('remove', () => {
        it('creates remove command that clears text', () => {
            const result = generator.remove([5, 10]);
            expect(result).toEqual<LinterFixCommand>({
                range: [5, 10],
                text: EMPTY,
            });
        });

        it('returns null for remove with invalid range', () => {
            const invalidSource = new MockLinterSourceCode([[50, 60]]);
            const invalidGenerator = new LinterFixGenerator(invalidSource as any);
            expect(invalidGenerator.remove([10, 20])).toBeNull();
        });
    });

    describe('edge and robustness tests', () => {
        it('handles zero-length ranges (insertion) correctly', () => {
            const result = generator.insertTextBefore([10, 10], 'X');
            expect(result).toEqual({ range: [10, 10], text: 'X' });
        });

        it('handles overlapping valid ranges correctly (first match wins)', () => {
            const overlappingSource = new MockLinterSourceCode([
                [0, 50],
                [25, 75],
            ]);
            const overlappingGenerator = new LinterFixGenerator(overlappingSource as any);
            const result = overlappingGenerator.insertTextAfter([30, 40], '!');
            expect(result).toEqual({ range: [40, 40], text: '!' });
        });

        it('handles fully invalid ranges gracefully (returns null everywhere)', () => {
            const invalidSource = new MockLinterSourceCode([]);
            const invalidGenerator = new LinterFixGenerator(invalidSource as any);

            expect(invalidGenerator.insertTextBefore([0, 1], 'A')).toBeNull();
            expect(invalidGenerator.insertTextAfter([0, 1], 'A')).toBeNull();
            expect(invalidGenerator.replaceWithText([0, 1], 'A')).toBeNull();
            expect(invalidGenerator.remove([0, 1])).toBeNull();
        });

        it('respects boundaries and does not throw when called with out-of-bounds ranges', () => {
            const result = generator.insertTextBefore([-10, -5], 'Safe');
            expect(result).toBeNull();
        });
    });
});
