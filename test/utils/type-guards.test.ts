/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import { describe, expect, test } from 'vitest';

import {
    isArrayOfUint8Arrays,
    isInteger,
    isNull,
    isNumber,
    isObject,
    isString,
    isUndefined,
} from '../../src/utils/type-guards';

describe('type-guards', () => {
    describe('isUndefined', () => {
        test('should return true for undefined', () => {
            expect(isUndefined(undefined)).toBe(true);
        });

        test('should return false for null', () => {
            expect(isUndefined(null)).toBe(false);
        });

        test('should return false for other falsy values', () => {
            expect(isUndefined(false)).toBe(false);
            expect(isUndefined(0)).toBe(false);
            expect(isUndefined('')).toBe(false);
            expect(isUndefined(NaN)).toBe(false);
        });

        test('should return false for truthy values', () => {
            expect(isUndefined(true)).toBe(false);
            expect(isUndefined(1)).toBe(false);
            expect(isUndefined('string')).toBe(false);
            expect(isUndefined({})).toBe(false);
            expect(isUndefined([])).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = undefined;
            if (isUndefined(value)) {
                // TypeScript should narrow the type to undefined
                const _narrowed: undefined = value;
                expect(_narrowed).toBeUndefined();
            }
        });
    });

    describe('isNull', () => {
        test('should return true for null', () => {
            expect(isNull(null)).toBe(true);
        });

        test('should return false for undefined', () => {
            expect(isNull(undefined)).toBe(false);
        });

        test('should return false for other falsy values', () => {
            expect(isNull(false)).toBe(false);
            expect(isNull(0)).toBe(false);
            expect(isNull('')).toBe(false);
            expect(isNull(NaN)).toBe(false);
        });

        test('should return false for truthy values', () => {
            expect(isNull(true)).toBe(false);
            expect(isNull(1)).toBe(false);
            expect(isNull('string')).toBe(false);
            expect(isNull({})).toBe(false);
            expect(isNull([])).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = null;
            if (isNull(value)) {
                // TypeScript should narrow the type to null
                const _narrowed: null = value;
                expect(_narrowed).toBeNull();
            }
        });
    });

    describe('isNumber', () => {
        test('should return true for valid numbers', () => {
            expect(isNumber(0)).toBe(true);
            expect(isNumber(1)).toBe(true);
            expect(isNumber(-1)).toBe(true);
            expect(isNumber(3.14)).toBe(true);
            expect(isNumber(-3.14)).toBe(true);
            expect(isNumber(Number.MAX_VALUE)).toBe(true);
            expect(isNumber(Number.MIN_VALUE)).toBe(true);
            expect(isNumber(Infinity)).toBe(true);
            expect(isNumber(-Infinity)).toBe(true);
        });

        test('should return false for NaN', () => {
            expect(isNumber(NaN)).toBe(false);
            expect(isNumber(Number.NaN)).toBe(false);
            expect(isNumber(0 / 0)).toBe(false);
        });

        test('should return false for non-numbers', () => {
            expect(isNumber('123')).toBe(false);
            expect(isNumber('0')).toBe(false);
            expect(isNumber(true)).toBe(false);
            expect(isNumber(false)).toBe(false);
            expect(isNumber(null)).toBe(false);
            expect(isNumber(undefined)).toBe(false);
            expect(isNumber({})).toBe(false);
            expect(isNumber([])).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = 42;
            if (isNumber(value)) {
                // TypeScript should narrow the type to number
                const _narrowed: number = value;
                expect(_narrowed + 1).toBe(43);
            }
        });
    });

    describe('isInteger', () => {
        test('should return true for integers', () => {
            expect(isInteger(0)).toBe(true);
            expect(isInteger(1)).toBe(true);
            expect(isInteger(-1)).toBe(true);
            expect(isInteger(42)).toBe(true);
            expect(isInteger(-42)).toBe(true);
            expect(isInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
            expect(isInteger(Number.MIN_SAFE_INTEGER)).toBe(true);
        });

        test('should return false for non-integers', () => {
            expect(isInteger(3.14)).toBe(false);
            expect(isInteger(-3.14)).toBe(false);
            expect(isInteger(0.1)).toBe(false);
            expect(isInteger(Infinity)).toBe(false);
            expect(isInteger(-Infinity)).toBe(false);
            expect(isInteger(NaN)).toBe(false);
        });

        test('should return false for non-numbers', () => {
            expect(isInteger('123')).toBe(false);
            expect(isInteger('0')).toBe(false);
            expect(isInteger(true)).toBe(false);
            expect(isInteger(false)).toBe(false);
            expect(isInteger(null)).toBe(false);
            expect(isInteger(undefined)).toBe(false);
            expect(isInteger({})).toBe(false);
            expect(isInteger([])).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = 42;
            if (isInteger(value)) {
                // TypeScript should narrow the type to number
                const _narrowed: number = value;
                expect(_narrowed % 1).toBe(0);
            }
        });
    });

    describe('isString', () => {
        test('should return true for strings', () => {
            expect(isString('')).toBe(true);
            expect(isString('hello')).toBe(true);
            expect(isString('123')).toBe(true);
            expect(isString(' ')).toBe(true);
            expect(isString('\n')).toBe(true);
            expect(isString('🚀')).toBe(true);
            expect(isString(String('test'))).toBe(true);
        });

        test('should return false for non-strings', () => {
            expect(isString(123)).toBe(false);
            expect(isString(0)).toBe(false);
            expect(isString(true)).toBe(false);
            expect(isString(false)).toBe(false);
            expect(isString(null)).toBe(false);
            expect(isString(undefined)).toBe(false);
            expect(isString({})).toBe(false);
            expect(isString([])).toBe(false);
            expect(isString(NaN)).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = 'hello';
            if (isString(value)) {
                // TypeScript should narrow the type to string
                const _narrowed: string = value;
                expect(_narrowed.toUpperCase()).toBe('HELLO');
            }
        });
    });

    describe('isArrayOfUint8Arrays', () => {
        test('should return true for arrays of Uint8Arrays', () => {
            expect(isArrayOfUint8Arrays([])).toBe(true);
            expect(isArrayOfUint8Arrays([new Uint8Array()])).toBe(true);
            expect(isArrayOfUint8Arrays([new Uint8Array([1, 2, 3])])).toBe(true);
            expect(isArrayOfUint8Arrays([
                new Uint8Array([1, 2, 3]),
                new Uint8Array([4, 5, 6]),
            ])).toBe(true);
            expect(isArrayOfUint8Arrays([
                new Uint8Array(),
                new Uint8Array([255]),
                new Uint8Array([0, 128, 255]),
            ])).toBe(true);
        });

        test('should return false for arrays with non-Uint8Array elements', () => {
            expect(isArrayOfUint8Arrays([1, 2, 3])).toBe(false);
            expect(isArrayOfUint8Arrays(['a', 'b', 'c'])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint8Array(), 'string'])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint8Array(), null])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint8Array(), undefined])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint8Array(), {}])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint8Array(), []])).toBe(false);
        });

        test('should return false for other typed arrays', () => {
            expect(isArrayOfUint8Arrays([new Int8Array()])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint16Array()])).toBe(false);
            expect(isArrayOfUint8Arrays([new Int16Array()])).toBe(false);
            expect(isArrayOfUint8Arrays([new Uint32Array()])).toBe(false);
            expect(isArrayOfUint8Arrays([new Int32Array()])).toBe(false);
            expect(isArrayOfUint8Arrays([new Float32Array()])).toBe(false);
            expect(isArrayOfUint8Arrays([new Float64Array()])).toBe(false);
        });

        test('should return false for non-arrays', () => {
            expect(isArrayOfUint8Arrays(new Uint8Array())).toBe(false);
            expect(isArrayOfUint8Arrays('string')).toBe(false);
            expect(isArrayOfUint8Arrays(123)).toBe(false);
            expect(isArrayOfUint8Arrays({})).toBe(false);
            expect(isArrayOfUint8Arrays(null)).toBe(false);
            expect(isArrayOfUint8Arrays(undefined)).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = [new Uint8Array([1, 2, 3])];
            if (isArrayOfUint8Arrays(value)) {
                // TypeScript should narrow the type to Uint8Array[]
                const _narrowed: Uint8Array[] = value;
                expect(_narrowed[0]![0]).toBe(1);
            }
        });
    });

    describe('isObject', () => {
        test('should return true for plain objects', () => {
            expect(isObject({})).toBe(true);
            expect(isObject({ key: 'value' })).toBe(true);
            expect(isObject({ a: 1, b: 2 })).toBe(true);
            expect(isObject(Object.create(null))).toBe(true);
            // eslint-disable-next-line no-new-object
            expect(isObject(new Object())).toBe(true);
        });

        test('should return true for class instances', () => {
            /**
             * Test class for isObject.
             */
            class TestClass {}
            expect(isObject(new TestClass())).toBe(true);
            expect(isObject(new Date())).toBe(true);
            expect(isObject(/test/)).toBe(true);
            expect(isObject(new Error('test'))).toBe(true);
        });

        test('should return false for arrays', () => {
            expect(isObject([])).toBe(false);
            expect(isObject([1, 2, 3])).toBe(false);
            expect(isObject([])).toBe(false);
        });

        test('should return false for null', () => {
            expect(isObject(null)).toBe(false);
        });

        test('should return false for primitives', () => {
            expect(isObject(undefined)).toBe(false);
            expect(isObject(true)).toBe(false);
            expect(isObject(false)).toBe(false);
            expect(isObject(123)).toBe(false);
            expect(isObject('string')).toBe(false);
            expect(isObject(Symbol('test'))).toBe(false);
            expect(isObject(BigInt(123))).toBe(false);
        });

        test('should return false for functions', () => {
            expect(isObject(() => {})).toBe(false);
            expect(isObject(() => {})).toBe(false);
            expect(isObject(async () => {})).toBe(false);
            // eslint-disable-next-line func-names, @typescript-eslint/no-empty-function
            expect(isObject(function* () {})).toBe(false);
        });

        test('should work as type guard', () => {
            const value: unknown = { key: 'value' };
            if (isObject(value)) {
                // TypeScript should narrow the type to Record<string, unknown>
                const _narrowed: Record<string, unknown> = value;
                expect(_narrowed.key).toBe('value');
            }
        });
    });

    describe('edge cases and combinations', () => {
        test('should handle complex nested structures', () => {
            const complexObject = {
                number: 42,
                string: 'test',
                array: [new Uint8Array([1, 2, 3])],
                nested: {
                    value: null,
                },
            };

            expect(isObject(complexObject)).toBe(true);
            expect(isNumber(complexObject.number)).toBe(true);
            expect(isString(complexObject.string)).toBe(true);
            expect(isNull(complexObject.nested.value)).toBe(true);
        });

        test('should work with type narrowing in conditional logic', () => {
            const testValue = (value: unknown) => {
                if (isString(value)) {
                    return value.length;
                }
                if (isNumber(value)) {
                    return value * 2;
                }
                if (isObject(value)) {
                    return Object.keys(value).length;
                }
                return 0;
            };

            expect(testValue('hello')).toBe(5);
            expect(testValue(21)).toBe(42);
            expect(testValue({ a: 1, b: 2 })).toBe(2);
            expect(testValue(null)).toBe(0);
        });

        test('should handle special number values correctly', () => {
            // Test that isNumber excludes NaN but isInteger also excludes it
            expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true);
            expect(isInteger(Number.POSITIVE_INFINITY)).toBe(false);

            expect(isNumber(Number.NEGATIVE_INFINITY)).toBe(true);
            expect(isInteger(Number.NEGATIVE_INFINITY)).toBe(false);

            expect(isNumber(Number.NaN)).toBe(false);
            expect(isInteger(Number.NaN)).toBe(false);
        });

        test('should handle edge cases with empty and whitespace strings', () => {
            expect(isString('')).toBe(true);
            expect(isString(' ')).toBe(true);
            expect(isString('\t\n\r')).toBe(true);
            expect(isString('\0')).toBe(true);
        });

        test('should handle mixed Uint8Array scenarios', () => {
            const mixedArray = [new Uint8Array([1]), 'not uint8array'];
            expect(isArrayOfUint8Arrays(mixedArray)).toBe(false);

            const emptyUint8Arrays = [new Uint8Array(), new Uint8Array()];
            expect(isArrayOfUint8Arrays(emptyUint8Arrays)).toBe(true);
        });
    });
});
