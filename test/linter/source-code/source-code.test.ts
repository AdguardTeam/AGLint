import { describe, expect, it } from 'vitest';

import { LineBreakType, LinterSourceCode } from '../../../src/linter/source-code/source-code';

describe('LinterSourceCode', () => {
    describe('constructor and basic methods', () => {
        it('creates instance with simple text', () => {
            const source = 'example.com';
            const sourceCode = new LinterSourceCode(source);

            expect(sourceCode.getText()).toBe(source);
            expect(sourceCode.getAst()).toBeDefined();
        });

        it('handles empty string', () => {
            const sourceCode = new LinterSourceCode('');
            expect(sourceCode.getText()).toBe('');
            expect(sourceCode.getAst()).toBeDefined();
        });

        it('handles multi-line filter list', () => {
            const source = 'example.com\n! comment\n##.ads';
            const sourceCode = new LinterSourceCode(source);
            expect(sourceCode.getAst().children).toBeDefined();
        });

        it('calls onParseError callback on errors', () => {
            let errorCalled = false;
            new LinterSourceCode('#%#//scriptlet(', () => {
                errorCalled = true;
            });
            expect(errorCalled).toBe(true);
        });
    });

    describe('getPositionFromOffset', () => {
        it('converts offset 0 to line 1, column 0', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getPositionFromOffset(0)).toEqual({ line: 1, column: 0 });
        });

        it('converts middle offset correctly', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.getPositionFromOffset(6)).toEqual({ line: 1, column: 6 });
        });

        it('handles multi-line text with LF', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getPositionFromOffset(0)).toEqual({ line: 1, column: 0 });
            expect(sourceCode.getPositionFromOffset(6)).toEqual({ line: 2, column: 0 });
            expect(sourceCode.getPositionFromOffset(12)).toEqual({ line: 3, column: 0 });
        });

        it('handles multi-line text with CRLF', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2\r\nline3');
            expect(sourceCode.getPositionFromOffset(0)).toEqual({ line: 1, column: 0 });
            expect(sourceCode.getPositionFromOffset(7)).toEqual({ line: 2, column: 0 });
            expect(sourceCode.getPositionFromOffset(14)).toEqual({ line: 3, column: 0 });
        });

        it('handles multi-line text with CR', () => {
            const sourceCode = new LinterSourceCode('line1\rline2');
            expect(sourceCode.getPositionFromOffset(6)).toEqual({ line: 2, column: 0 });
        });

        it('handles form feed (FF)', () => {
            const sourceCode = new LinterSourceCode('line1\fline2');
            expect(sourceCode.getPositionFromOffset(6)).toEqual({ line: 2, column: 0 });
        });

        it('returns null for negative offset', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getPositionFromOffset(-1)).toBeNull();
        });

        it('returns null for offset beyond string length', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getPositionFromOffset(4)).toBeNull();
        });

        it('handles offset at string length (end)', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getPositionFromOffset(3)).toEqual({ line: 1, column: 3 });
        });
    });

    describe('getOffsetFromPosition', () => {
        it('converts line 1, column 0 to offset 0', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getOffsetFromPosition({ line: 1, column: 0 })).toBe(0);
        });

        it('converts position in single line correctly', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.getOffsetFromPosition({ line: 1, column: 6 })).toBe(6);
        });

        it('handles multi-line text', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getOffsetFromPosition({ line: 1, column: 0 })).toBe(0);
            expect(sourceCode.getOffsetFromPosition({ line: 2, column: 0 })).toBe(6);
            expect(sourceCode.getOffsetFromPosition({ line: 3, column: 0 })).toBe(12);
        });

        it('returns null for invalid line number', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getOffsetFromPosition({ line: 0, column: 0 })).toBeNull();
            expect(sourceCode.getOffsetFromPosition({ line: 2, column: 0 })).toBeNull();
        });

        it('returns null for column beyond line length', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getOffsetFromPosition({ line: 1, column: 10 })).toBeNull();
        });

        it('returns null for negative column', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getOffsetFromPosition({ line: 1, column: -1 })).toBeNull();
        });
    });

    describe('getLineNumberForOffset', () => {
        it('returns line 1 for offset 0', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineNumberForOffset(0)).toBe(1);
        });

        it('returns correct line number for multi-line text', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getLineNumberForOffset(0)).toBe(1);
            expect(sourceCode.getLineNumberForOffset(6)).toBe(2);
            expect(sourceCode.getLineNumberForOffset(12)).toBe(3);
        });

        it('returns null for invalid offset', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineNumberForOffset(-1)).toBeNull();
            expect(sourceCode.getLineNumberForOffset(4)).toBeNull();
        });
    });

    describe('getLineStartOffsetByLine', () => {
        it('returns 0 for line 1', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineStartOffsetByLine(1)).toBe(0);
        });

        it('returns correct offsets for multi-line text', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getLineStartOffsetByLine(1)).toBe(0);
            expect(sourceCode.getLineStartOffsetByLine(2)).toBe(6);
            expect(sourceCode.getLineStartOffsetByLine(3)).toBe(12);
        });

        it('handles CRLF line breaks', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2');
            expect(sourceCode.getLineStartOffsetByLine(1)).toBe(0);
            expect(sourceCode.getLineStartOffsetByLine(2)).toBe(7);
        });

        it('returns null for invalid line number', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineStartOffsetByLine(0)).toBeNull();
            expect(sourceCode.getLineStartOffsetByLine(2)).toBeNull();
        });
    });

    describe('getLineRange', () => {
        it('returns range for single line', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineRange(1, false)).toEqual([0, 3]);
        });

        it('excludes newline for LF', () => {
            const sourceCode = new LinterSourceCode('line1\nline2');
            expect(sourceCode.getLineRange(1, false)).toEqual([0, 5]);
        });

        it('includes newline for LF', () => {
            const sourceCode = new LinterSourceCode('line1\nline2');
            expect(sourceCode.getLineRange(1, true)).toEqual([0, 6]);
        });

        it('excludes CRLF', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2');
            expect(sourceCode.getLineRange(1, false)).toEqual([0, 5]);
        });

        it('includes CRLF', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2');
            expect(sourceCode.getLineRange(1, true)).toEqual([0, 7]);
        });

        it('handles last line without newline', () => {
            const sourceCode = new LinterSourceCode('line1\nline2');
            expect(sourceCode.getLineRange(2, false)).toEqual([6, 11]);
        });

        it('returns null for invalid line number', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineRange(0, false)).toBeNull();
            expect(sourceCode.getLineRange(2, false)).toBeNull();
        });

        it('handles empty lines', () => {
            const sourceCode = new LinterSourceCode('line1\n\nline3');
            expect(sourceCode.getLineRange(2, false)).toEqual([6, 6]);
        });
    });

    describe('getLine', () => {
        it('returns content of single line', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.getLine(1)).toBe('hello world');
        });

        it('returns content of specific line in multi-line text', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getLine(1)).toBe('line1');
            expect(sourceCode.getLine(2)).toBe('line2');
            expect(sourceCode.getLine(3)).toBe('line3');
        });

        it('handles CRLF line breaks', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2');
            expect(sourceCode.getLine(1)).toBe('line1');
            expect(sourceCode.getLine(2)).toBe('line2');
        });

        it('handles empty lines', () => {
            const sourceCode = new LinterSourceCode('line1\n\nline3');
            expect(sourceCode.getLine(2)).toBe('');
        });

        it('returns null for invalid line number', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLine(0)).toBeNull();
            expect(sourceCode.getLine(2)).toBeNull();
        });
    });

    describe('getLinebreakType', () => {
        it('returns LineFeed for LF', () => {
            const sourceCode = new LinterSourceCode('line1\nline2');
            expect(sourceCode.getLinebreakType(1)).toBe(LineBreakType.LineFeed);
        });

        it('returns CarriageReturn for CR', () => {
            const sourceCode = new LinterSourceCode('line1\rline2');
            expect(sourceCode.getLinebreakType(1)).toBe(LineBreakType.CarriageReturn);
        });

        it('returns CarriageReturnLineFeed for CRLF', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2');
            expect(sourceCode.getLinebreakType(1)).toBe(LineBreakType.CarriageReturnLineFeed);
        });

        it('returns LineFeed for FF', () => {
            const sourceCode = new LinterSourceCode('line1\fline2');
            expect(sourceCode.getLinebreakType(1)).toBe(LineBreakType.LineFeed);
        });

        it('returns null for last line without newline', () => {
            const sourceCode = new LinterSourceCode('line1\nline2');
            expect(sourceCode.getLinebreakType(2)).toBeNull();
        });

        it('handles mixed line breaks', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\r\nline3\rline4');
            expect(sourceCode.getLinebreakType(1)).toBe(LineBreakType.LineFeed);
            expect(sourceCode.getLinebreakType(2)).toBe(LineBreakType.CarriageReturnLineFeed);
            expect(sourceCode.getLinebreakType(3)).toBe(LineBreakType.CarriageReturn);
        });
    });

    describe('getLineBreak', () => {
        it('returns \\n for LF', () => {
            const sourceCode = new LinterSourceCode('line1\nline2');
            expect(sourceCode.getLineBreak(1)).toBe('\n');
        });

        it('returns \\r for CR', () => {
            const sourceCode = new LinterSourceCode('line1\rline2');
            expect(sourceCode.getLineBreak(1)).toBe('\r');
        });

        it('returns \\r\\n for CRLF', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2');
            expect(sourceCode.getLineBreak(1)).toBe('\r\n');
        });

        it('returns fallback for invalid line', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.getLineBreak(2)).toBe('\n');
            expect(sourceCode.getLineBreak(2, '\r\n')).toBe('\r\n');
        });
    });

    describe('getDominantLineBreak', () => {
        it('returns LF when only LF is used', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getDominantLineBreak()).toBe('\n');
        });

        it('returns CR when only CR is used', () => {
            const sourceCode = new LinterSourceCode('line1\rline2\rline3');
            expect(sourceCode.getDominantLineBreak()).toBe('\r');
        });

        it('returns CRLF when only CRLF is used', () => {
            const sourceCode = new LinterSourceCode('line1\r\nline2\r\nline3');
            expect(sourceCode.getDominantLineBreak()).toBe('\r\n');
        });

        it('returns most common line break', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3\rline4');
            expect(sourceCode.getDominantLineBreak()).toBe('\n');
        });

        it('returns CRLF for single line', () => {
            const sourceCode = new LinterSourceCode('single line');
            expect(sourceCode.getDominantLineBreak()).toBe('\r\n');
        });
    });

    describe('isOffsetValid', () => {
        it('returns true for valid offsets', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.isOffsetValid(0)).toBe(true);
            expect(sourceCode.isOffsetValid(3)).toBe(true);
        });

        it('returns false for negative offset', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.isOffsetValid(-1)).toBe(false);
        });

        it('returns false for offset beyond string length', () => {
            const sourceCode = new LinterSourceCode('abc');
            expect(sourceCode.isOffsetValid(4)).toBe(false);
        });

        it('handles empty string', () => {
            const sourceCode = new LinterSourceCode('');
            expect(sourceCode.isOffsetValid(0)).toBe(true);
            expect(sourceCode.isOffsetValid(1)).toBe(false);
        });
    });

    describe('isRangeValid', () => {
        it('returns true for valid range', () => {
            const sourceCode = new LinterSourceCode('hello');
            expect(sourceCode.isRangeValid([0, 5])).toBe(true);
        });

        it('returns true for empty range', () => {
            const sourceCode = new LinterSourceCode('hello');
            expect(sourceCode.isRangeValid([2, 2])).toBe(true);
        });

        it('returns false for invalid start offset', () => {
            const sourceCode = new LinterSourceCode('hello');
            expect(sourceCode.isRangeValid([-1, 3])).toBe(false);
        });

        it('returns false for invalid end offset', () => {
            const sourceCode = new LinterSourceCode('hello');
            expect(sourceCode.isRangeValid([0, 6])).toBe(false);
        });

        it('returns false when start > end', () => {
            const sourceCode = new LinterSourceCode('hello');
            expect(sourceCode.isRangeValid([3, 1])).toBe(false);
        });
    });

    describe('getLinterPositionRangeFromOffsetRange', () => {
        it('converts valid offset range to position range', () => {
            const sourceCode = new LinterSourceCode('hello\nworld');
            const posRange = sourceCode.getLinterPositionRangeFromOffsetRange([0, 5]);
            expect(posRange).toEqual({
                start: { line: 1, column: 0 },
                end: { line: 1, column: 5 },
            });
        });

        it('handles multi-line range', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            const posRange = sourceCode.getLinterPositionRangeFromOffsetRange([0, 12]);
            expect(posRange).toEqual({
                start: { line: 1, column: 0 },
                end: { line: 3, column: 0 },
            });
        });

        it('returns null for invalid offsets', () => {
            const sourceCode = new LinterSourceCode('hello');
            expect(sourceCode.getLinterPositionRangeFromOffsetRange([-1, 3])).toBeNull();
            expect(sourceCode.getLinterPositionRangeFromOffsetRange([0, 10])).toBeNull();
        });
    });

    describe('getSlicedPart', () => {
        it('returns full text without parameters', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.getSlicedPart()).toBe('hello world');
        });

        it('slices with start parameter', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.getSlicedPart(6)).toBe('world');
        });

        it('slices with start and end parameters', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.getSlicedPart(0, 5)).toBe('hello');
        });

        it('handles multi-line slicing', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            expect(sourceCode.getSlicedPart(6, 11)).toBe('line2');
        });
    });

    describe('findNextUnescapedChar', () => {
        it('finds character in simple text', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findNextUnescapedChar(0, 'o')).toBe(4);
        });

        it('finds next occurrence from given start', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findNextUnescapedChar(5, 'o')).toBe(7);
        });

        it('returns null if character not found', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findNextUnescapedChar(0, 'x')).toBeNull();
        });

        it('respects end parameter', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findNextUnescapedChar(0, 'w', 5)).toBeNull();
            expect(sourceCode.findNextUnescapedChar(0, 'w', 10)).toBe(6);
        });

        it('handles empty string', () => {
            const sourceCode = new LinterSourceCode('');
            expect(sourceCode.findNextUnescapedChar(0, 'a')).toBeNull();
        });
    });

    describe('findPreviousUnescapedChar', () => {
        it('finds character searching backwards', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findPreviousUnescapedChar(10, 'o')).toBe(7);
        });

        it('finds previous occurrence from given start', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findPreviousUnescapedChar(6, 'o')).toBe(4);
        });

        it('returns null if character not found', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findPreviousUnescapedChar(10, 'x')).toBeNull();
        });

        it('respects end parameter', () => {
            const sourceCode = new LinterSourceCode('hello world');
            expect(sourceCode.findPreviousUnescapedChar(10, 'h', 1)).toBeNull();
            expect(sourceCode.findPreviousUnescapedChar(10, 'h', 0)).toBe(0);
        });

        it('handles empty string', () => {
            const sourceCode = new LinterSourceCode('');
            expect(sourceCode.findPreviousUnescapedChar(0, 'a')).toBeNull();
        });
    });

    describe('edge cases', () => {
        it('handles text with only newlines', () => {
            const sourceCode = new LinterSourceCode('\n\n\n');
            expect(sourceCode.getLine(1)).toBe('');
            expect(sourceCode.getLine(2)).toBe('');
            expect(sourceCode.getLine(3)).toBe('');
        });

        it('handles text with multiple consecutive newlines', () => {
            const sourceCode = new LinterSourceCode('a\n\n\nb');
            expect(sourceCode.getLine(1)).toBe('a');
            expect(sourceCode.getLine(2)).toBe('');
            expect(sourceCode.getLine(3)).toBe('');
            expect(sourceCode.getLine(4)).toBe('b');
        });

        it('handles very long lines', () => {
            const longLine = 'a'.repeat(10000);
            const sourceCode = new LinterSourceCode(longLine);
            expect(sourceCode.getLine(1)).toBe(longLine);
            expect(sourceCode.getPositionFromOffset(9999)).toEqual({ line: 1, column: 9999 });
        });

        it('handles unicode characters', () => {
            const sourceCode = new LinterSourceCode('hello 世界\ntest');
            expect(sourceCode.getLine(1)).toBe('hello 世界');
            expect(sourceCode.getLine(2)).toBe('test');
        });

        it('handles tab characters', () => {
            const sourceCode = new LinterSourceCode('test\ttab\nline2');
            expect(sourceCode.getLine(1)).toContain('\t');
        });

        it('handles position-offset roundtrip conversions', () => {
            const sourceCode = new LinterSourceCode('line1\nline2\nline3');
            const offset = 8;
            const position = sourceCode.getPositionFromOffset(offset);
            const backToOffset = sourceCode.getOffsetFromPosition(position!);
            expect(backToOffset).toBe(offset);
        });

        it('handles boundary conditions at line endings', () => {
            const sourceCode = new LinterSourceCode('abc\nxyz');
            // Position at end of line 1 (just before newline)
            expect(sourceCode.getPositionFromOffset(3)).toEqual({ line: 1, column: 3 });
            // Position at start of line 2 (after newline)
            expect(sourceCode.getPositionFromOffset(4)).toEqual({ line: 2, column: 0 });
        });
    });

    describe('AST immutability', () => {
        it('freezes the AST to prevent mutations', () => {
            const sourceCode = new LinterSourceCode('example.com');
            const ast = sourceCode.getAst();

            // Verify the AST is frozen
            expect(Object.isFrozen(ast)).toBe(true);
        });

        it('prevents adding properties to AST root', () => {
            const sourceCode = new LinterSourceCode('example.com');
            const ast = sourceCode.getAst() as any;

            // Attempting to add a property should throw in strict mode or silently fail
            expect(() => {
                ast.newProperty = 'test';
            }).toThrow();
        });

        it('prevents modifying AST properties', () => {
            const sourceCode = new LinterSourceCode('example.com');
            const ast = sourceCode.getAst() as any;

            // Attempting to modify a property should throw in strict mode or silently fail
            expect(() => {
                ast.type = 'modified';
            }).toThrow();
        });

        it('freezes nested AST nodes', () => {
            const sourceCode = new LinterSourceCode('example.com\n##.ad');
            const ast = sourceCode.getAst();

            // Check that children array is frozen
            expect(Object.isFrozen(ast.children)).toBe(true);

            // Check that individual child nodes are frozen
            if (ast.children.length > 0) {
                expect(Object.isFrozen(ast.children[0])).toBe(true);
            }
        });

        it('prevents adding items to children array', () => {
            const sourceCode = new LinterSourceCode('example.com');
            const ast = sourceCode.getAst();

            // Attempting to push to children should throw or fail
            expect(() => {
                (ast.children as any).push({ type: 'fake' });
            }).toThrow();
        });

        it('prevents modifying nested node properties', () => {
            const sourceCode = new LinterSourceCode('example.com\n##.ad');
            const ast = sourceCode.getAst();

            if (ast.children.length > 0) {
                const firstChild = ast.children[0] as any;

                // Attempting to modify nested properties should throw
                expect(() => {
                    firstChild.type = 'modified';
                }).toThrow();
            }
        });
    });
});
