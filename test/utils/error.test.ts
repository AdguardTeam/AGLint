/* eslint-disable max-classes-per-file */
import { describe, expect, test } from 'vitest';

import { getErrorMessage, getFormattedError } from '../../src/utils/error';

describe('error utilities', () => {
    describe('getErrorMessage', () => {
        test('should extract message from Error objects', () => {
            const error = new Error('Test error message');
            expect(getErrorMessage(error)).toBe('Test error message');
        });

        test('should extract message from custom Error subclasses', () => {
            class CustomError extends Error {
                constructor(message: string) {
                    super(message);
                    this.name = 'CustomError';
                }
            }

            const error = new CustomError('Custom error message');
            expect(getErrorMessage(error)).toBe('Custom error message');
        });

        test('should handle Error objects with empty message', () => {
            const error = new Error('');
            expect(getErrorMessage(error)).toBe('');
        });

        test('should handle objects with message property', () => {
            const errorLike = { message: 'Object with message' };
            expect(getErrorMessage(errorLike)).toBe('Object with message');
        });

        test('should handle objects with message and other properties', () => {
            const errorLike = {
                message: 'Error message',
                code: 500,
                details: 'Additional info',
            };
            expect(getErrorMessage(errorLike)).toBe('Error message');
        });

        test('should convert strings to error messages', () => {
            expect(getErrorMessage('Simple string error')).toBe('"Simple string error"');
            expect(getErrorMessage('')).toBe('""');
        });

        test('should convert numbers to error messages', () => {
            expect(getErrorMessage(404)).toBe('404');
            expect(getErrorMessage(0)).toBe('0');
            expect(getErrorMessage(-1)).toBe('-1');
            expect(getErrorMessage(3.14)).toBe('3.14');
        });

        test('should convert booleans to error messages', () => {
            expect(getErrorMessage(true)).toBe('true');
            expect(getErrorMessage(false)).toBe('false');
        });

        test('should handle null and undefined', () => {
            expect(getErrorMessage(null)).toBe('null');
            expect(getErrorMessage(undefined)).toBe('');
        });

        test('should handle arrays', () => {
            expect(getErrorMessage([1, 2, 3])).toBe('[1,2,3]');
            expect(getErrorMessage([])).toBe('[]');
            expect(getErrorMessage(['a', 'b'])).toBe('["a","b"]');
        });

        test('should handle plain objects', () => {
            expect(getErrorMessage({ key: 'value' })).toBe('{"key":"value"}');
            expect(getErrorMessage({})).toBe('{}');
        });

        test('should handle objects without message property', () => {
            const obj = { code: 500, status: 'error' };
            expect(getErrorMessage(obj)).toBe('{"code":500,"status":"error"}');
        });

        test('should handle objects with non-string message property', () => {
            const obj = { message: 123 };
            expect(getErrorMessage(obj)).toBe('{"message":123}');
        });

        test('should handle circular references gracefully', () => {
            const circular: any = { name: 'circular' };
            circular.self = circular;

            const result = getErrorMessage(circular);
            expect(result).toBe('[object Object]');
        });

        test('should handle complex nested objects', () => {
            const complex = {
                level1: {
                    level2: {
                        message: 'nested message',
                        data: [1, 2, 3],
                    },
                },
            };

            const result = getErrorMessage(complex);
            expect(result).toContain('level1');
            expect(result).toContain('level2');
        });

        test('should handle symbols', () => {
            const sym = Symbol('test');
            const result = getErrorMessage(sym);
            expect(result).toBe('');
        });

        test('should handle BigInt', () => {
            const bigInt = BigInt(123456789);
            const result = getErrorMessage(bigInt);
            expect(result).toBe('123456789');
        });

        test('should handle functions', () => {
            const func = () => 'test';
            const result = getErrorMessage(func);
            expect(result).toBe('');
        });
    });

    describe('getFormattedError', () => {
        test('should format Error objects with message and stack', () => {
            const error = new Error('Test error');
            const formatted = getFormattedError(error);

            expect(formatted).toContain('Test error');
            expect(formatted).toContain('\n');
            // Should contain indented stack trace lines
            const lines = formatted.split('\n');
            expect(lines[0]).toBe('Test error');
            expect(lines[1]).toBe('');
            // Stack trace lines should be indented
            expect(lines.slice(2).some((line) => line.startsWith('  '))).toBe(true);
        });

        test('should handle Error with empty message', () => {
            const error = new Error('');
            const formatted = getFormattedError(error);

            expect(formatted).toContain('No error message provided');
        });

        test('should handle Error with no message', () => {
            const error = new Error();
            // Clear the message to simulate an error with no message
            (error as any).message = '';

            const formatted = getFormattedError(error);
            expect(formatted).toContain('No error message provided');
        });

        test('should format custom Error subclasses', () => {
            class CustomError extends Error {
                constructor(message: string) {
                    super(message);
                    this.name = 'CustomError';
                }
            }

            const error = new CustomError('Custom error occurred');
            const formatted = getFormattedError(error);

            expect(formatted).toContain('Custom error occurred');
            expect(formatted).toContain('\n');
        });

        test('should handle Error without stack trace', () => {
            const error = new Error('Test error');
            // Remove stack trace
            delete (error as any).stack;

            const formatted = getFormattedError(error);
            expect(formatted).toBe('Test error\n\n  ');
        });

        test('should handle Error with empty stack trace', () => {
            const error = new Error('Test error');
            (error as any).stack = '';

            const formatted = getFormattedError(error);
            expect(formatted).toBe('Test error\n\n  ');
        });

        test('should format non-Error objects as strings', () => {
            expect(getFormattedError('Simple string')).toBe('Simple string');
            expect(getFormattedError(404)).toBe('404');
            expect(getFormattedError(true)).toBe('true');
            expect(getFormattedError(null)).toBe('null');
            expect(getFormattedError(undefined)).toBe('undefined');
        });

        test('should format objects as strings', () => {
            const obj = { key: 'value', number: 42 };
            const formatted = getFormattedError(obj);
            expect(formatted).toBe('[object Object]');
        });

        test('should format arrays as strings', () => {
            const arr = [1, 2, 3];
            const formatted = getFormattedError(arr);
            expect(formatted).toBe('1,2,3');
        });

        test('should handle complex stack traces', () => {
            const error = new Error('Complex error');
            // Simulate a multi-line stack trace
            // eslint-disable-next-line max-len
            (error as any).stack = 'Error: Complex error\n    at function1 (file1.js:10:5)\n    at function2 (file2.js:20:10)';

            const formatted = getFormattedError(error);
            const lines = formatted.split('\n');

            expect(lines[0]).toBe('Complex error');
            expect(lines[1]).toBe('');
            expect(lines[2]).toBe('  Error: Complex error');
            expect(lines[3]).toBe('      at function1 (file1.js:10:5)');
            expect(lines[4]).toBe('      at function2 (file2.js:20:10)');
        });

        test('should handle symbols', () => {
            const sym = Symbol('error symbol');
            const formatted = getFormattedError(sym);
            expect(formatted).toBe('Symbol(error symbol)');
        });

        test('should handle BigInt', () => {
            const bigInt = BigInt(987654321);
            const formatted = getFormattedError(bigInt);
            expect(formatted).toBe('987654321');
        });

        test('should handle functions', () => {
            const func = function namedFunction() { return 'test'; };
            const formatted = getFormattedError(func);
            expect(formatted).toContain('function');
        });

        test('should handle circular references', () => {
            const circular: any = { name: 'circular' };
            circular.self = circular;

            const formatted = getFormattedError(circular);
            expect(formatted).toBe('[object Object]');
        });
    });

    describe('edge cases and integration', () => {
        test('should handle TypeError instances', () => {
            const error = new TypeError('Type error occurred');

            expect(getErrorMessage(error)).toBe('Type error occurred');

            const formatted = getFormattedError(error);
            expect(formatted).toContain('Type error occurred');
        });

        test('should handle ReferenceError instances', () => {
            const error = new ReferenceError('Reference error occurred');

            expect(getErrorMessage(error)).toBe('Reference error occurred');

            const formatted = getFormattedError(error);
            expect(formatted).toContain('Reference error occurred');
        });

        test('should handle SyntaxError instances', () => {
            const error = new SyntaxError('Syntax error occurred');

            expect(getErrorMessage(error)).toBe('Syntax error occurred');

            const formatted = getFormattedError(error);
            expect(formatted).toContain('Syntax error occurred');
        });

        test('should handle objects that throw during JSON.stringify', () => {
            const problematicObject = {
                toJSON() {
                    throw new Error('Cannot stringify');
                },
            };

            // Should fallback to String() conversion
            const result = getErrorMessage(problematicObject);
            expect(result).toBe('[object Object]');
        });

        test('should handle very large objects', () => {
            const largeObject: any = {};
            for (let i = 0; i < 1000; i += 1) {
                largeObject[`key${i}`] = `value${i}`;
            }

            const result = getErrorMessage(largeObject);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('should maintain consistency between functions', () => {
            const testCases = [
                new Error('Test error'),
                'String error',
                { message: 'Object error' },
                404,
                null,
                undefined,
            ];

            for (const testCase of testCases) {
                const message = getErrorMessage(testCase);
                const formatted = getFormattedError(testCase);

                expect(typeof message).toBe('string');
                expect(typeof formatted).toBe('string');

                if (testCase instanceof Error) {
                    expect(formatted).toContain(message);
                } else {
                    // For non-Error types, both functions should return the same string representation
                    expect(typeof formatted).toBe('string');
                    expect(typeof message).toBe('string');
                }
            }
        });
    });
});
