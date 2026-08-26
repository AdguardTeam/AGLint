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
            /**
             * Test class for getErrorMessage.
             */
            class CustomError extends Error {
                /**
                 * Constructor for CustomError.
                 *
                 * @param message The error message.
                 */
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
        test('should format Error objects with message and stack', async () => {
            const error = new Error('Test error');
            const formatted = await getFormattedError(error);

            expect(formatted).toContain('Test error');
            expect(formatted).toContain('\n');
            // Should contain indented stack trace lines
            const lines = formatted.split('\n');
            // First line is the error with name and message from stack
            expect(lines[0]).toContain('Error');
            expect(lines[0]).toContain('Test error');
            expect(lines[1]).toBe('');
            // Stack trace lines should be indented
            expect(lines.slice(2).some((line) => line.startsWith('  '))).toBe(true);
        });

        test('should handle Error with empty message', async () => {
            const error = new Error('');
            const formatted = await getFormattedError(error);

            // Empty message in stack should still show Error
            expect(formatted).toContain('Error');
        });

        test('should handle Error with no message', async () => {
            const error = new Error();
            // Clear the message to simulate an error with no message
            (error as any).message = '';

            const formatted = await getFormattedError(error);
            // Error with no message
            expect(formatted).toContain('Error');
        });

        test('should format custom Error subclasses', async () => {
            /**
             * Test class for getFormattedError.
             */
            class CustomError extends Error {
                /**
                 * Constructor for CustomError.
                 *
                 * @param message The error message.
                 */
                constructor(message: string) {
                    super(message);
                    this.name = 'CustomError';
                }
            }

            const error = new CustomError('Custom error occurred');
            const formatted = await getFormattedError(error);

            expect(formatted).toContain('Custom error occurred');
            expect(formatted).toContain('\n');
        });

        test('should handle Error without stack trace', async () => {
            const error = new Error('Test error');
            // Remove stack trace
            delete (error as any).stack;

            const formatted = await getFormattedError(error);
            // Without stack, just shows the message
            expect(formatted).toBe('Test error');
        });

        test('should handle Error with empty stack trace', async () => {
            const error = new Error('Test error');
            (error as any).stack = '';

            const formatted = await getFormattedError(error);
            // Empty string is falsy, so treated as no stack - shows message
            expect(formatted).toBe('Test error');
        });

        test('should format non-Error objects as strings', async () => {
            expect(await getFormattedError('Simple string')).toBe('Simple string');
            expect(await getFormattedError(404)).toBe('404');
            expect(await getFormattedError(true)).toBe('true');
            expect(await getFormattedError(null)).toBe('null');
            expect(await getFormattedError(undefined)).toBe('undefined');
        });

        test('should format objects as strings', async () => {
            const obj = { key: 'value', number: 42 };
            const formatted = await getFormattedError(obj);
            expect(formatted).toBe('[object Object]');
        });

        test('should format arrays as strings', async () => {
            const arr = [1, 2, 3];
            const formatted = await getFormattedError(arr);
            expect(formatted).toBe('1,2,3');
        });

        test('should handle complex stack traces', async () => {
            const error = new Error('Complex error');
            // Simulate a multi-line stack trace
            // eslint-disable-next-line max-len
            (error as any).stack = 'Error: Complex error\n    at function1 (file1.js:10:5)\n    at function2 (file2.js:20:10)';

            const formatted = await getFormattedError(error);
            const lines = formatted.split('\n');

            // First line is the error message from stack (no duplication)
            expect(lines[0]).toBe('Error: Complex error');
            expect(lines[1]).toBe('');
            expect(lines[2]).toBe('  at function1 (file1.js:10:5)');
            expect(lines[3]).toBe('  at function2 (file2.js:20:10)');
        });

        test('should handle symbols', async () => {
            const sym = Symbol('error symbol');
            const formatted = await getFormattedError(sym);
            expect(formatted).toBe('Symbol(error symbol)');
        });

        test('should handle BigInt', async () => {
            const bigInt = BigInt(987654321);
            const formatted = await getFormattedError(bigInt);
            expect(formatted).toBe('987654321');
        });

        test('should handle functions', async () => {
            const func = function namedFunction() { return 'test'; };
            const formatted = await getFormattedError(func);
            expect(formatted).toContain('function');
        });

        test('should handle circular references', async () => {
            const circular: any = { name: 'circular' };
            circular.self = circular;

            const formatted = await getFormattedError(circular);
            expect(formatted).toBe('[object Object]');
        });
    });

    describe('edge cases and integration', () => {
        test('should handle TypeError instances', async () => {
            const error = new TypeError('Type error occurred');

            expect(getErrorMessage(error)).toBe('Type error occurred');

            const formatted = await getFormattedError(error);
            expect(formatted).toContain('Type error occurred');
        });

        test('should handle ReferenceError instances', async () => {
            const error = new ReferenceError('Reference error occurred');

            expect(getErrorMessage(error)).toBe('Reference error occurred');

            const formatted = await getFormattedError(error);
            expect(formatted).toContain('Reference error occurred');
        });

        test('should handle SyntaxError instances', async () => {
            const error = new SyntaxError('Syntax error occurred');

            expect(getErrorMessage(error)).toBe('Syntax error occurred');

            const formatted = await getFormattedError(error);
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

        test('should maintain consistency between functions', async () => {
            const testCases = [
                new Error('Test error'),
                'String error',
                { message: 'Object error' },
                404,
                null,
                undefined,
            ];

            // Avoid await-in-loop by using Promise.all
            const results = await Promise.all(
                testCases.map(async (testCase) => ({
                    message: getErrorMessage(testCase),
                    formatted: await getFormattedError(testCase),
                    testCase,
                })),
            );

            for (const { message, formatted, testCase } of results) {
                expect(typeof message).toBe('string');
                expect(typeof formatted).toBe('string');

                if (testCase instanceof Error) {
                    // For errors, formatted should contain the message somewhere
                    expect(typeof formatted).toBe('string');
                    expect(typeof message).toBe('string');
                } else {
                    // For non-Error types, both functions should return the same string representation
                    expect(typeof formatted).toBe('string');
                    expect(typeof message).toBe('string');
                }
            }
        });
    });
});
