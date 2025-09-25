import { assert } from 'superstruct';
import { describe, expect, test } from 'vitest';

import { linterRuleConfigSchema } from '../../src/linter/rule';

describe('Linter rule', () => {
    test('check custom Superstruct validation', () => {
        // Valid cases
        expect(() => assert('off', linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert('warn', linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert('error', linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert('fatal', linterRuleConfigSchema)).not.toThrowError();

        expect(() => assert(['off'], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(['warn'], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(['error'], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(['fatal'], linterRuleConfigSchema)).not.toThrowError();

        // Some config data
        expect(() => assert(['off', { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(['warn', { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(['error', { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(['fatal', { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();

        expect(() => assert(0, linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(1, linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(2, linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert(3, linterRuleConfigSchema)).not.toThrowError();

        expect(() => assert([0], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert([1], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert([2], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert([3], linterRuleConfigSchema)).not.toThrowError();

        expect(() => assert([0, { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert([1, { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert([2, { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();
        expect(() => assert([3, { a: 'b', c: [-1, 1] }], linterRuleConfigSchema)).not.toThrowError();

        // Invalid cases
        expect(() => assert(-1, linterRuleConfigSchema)).toThrowError();
        expect(() => assert(4, linterRuleConfigSchema)).toThrowError();
        expect(() => assert(5, linterRuleConfigSchema)).toThrowError();

        expect(() => assert('', linterRuleConfigSchema)).toThrowError();
        expect(() => assert('ofF', linterRuleConfigSchema)).toThrowError();
        expect(() => assert('o2f', linterRuleConfigSchema)).toThrowError();

        expect(() => assert([''], linterRuleConfigSchema)).toThrowError();
        expect(() => assert(['ofF'], linterRuleConfigSchema)).toThrowError();
        expect(() => assert(['o2f'], linterRuleConfigSchema)).toThrowError();
    });
});
