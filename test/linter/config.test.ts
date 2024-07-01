import { assert } from 'superstruct';
import Ajv from 'ajv';

import linterConfigJsonSchema from '../../src/linter/aglintrc-json-schema.json';
import { linterConfigSchema, mergeConfigs } from '../../src/linter/config';

describe('Linter config', () => {
    describe('mergeConfigs', () => {
        test('should merge configs when rule values are arrays', () => {
            expect(
                mergeConfigs(
                    {
                        rules: {
                            'rule-1': ['warn', 'value-1', 'value-2'],
                            'rule-2': ['error', 'value-1', 'value-2'],
                            'rule-3': ['error', 'value-1', 'value-2'],
                        },
                    },
                    {
                        rules: {
                            'rule-1': ['error', 'value-1', 'value-2'],
                            'rule-2': ['error', 'value-1', 'value-2'],
                            'rule-3': ['warn', 'value-1', 'value-2'],
                        },
                    },
                ),
            ).toMatchObject({
                rules: {
                    'rule-1': ['error', 'value-1', 'value-2'],
                    'rule-2': ['error', 'value-1', 'value-2'],
                    'rule-3': ['warn', 'value-1', 'value-2'],
                },
            });
        });

        test('should merge configs when source rules are empty', () => {
            expect(
                mergeConfigs(
                    {
                        rules: {},
                    },
                    {
                        rules: {
                            'rule-1': ['error', 'value-1', 'value-2'],
                            'rule-2': ['error', 'value-1', 'value-2'],
                            'rule-3': ['warn', 'value-1', 'value-2'],
                        },
                    },
                ),
            ).toMatchObject({
                rules: {
                    'rule-1': ['error', 'value-1', 'value-2'],
                    'rule-2': ['error', 'value-1', 'value-2'],
                    'rule-3': ['warn', 'value-1', 'value-2'],
                },
            });
        });

        test('should merge complicated configs', () => {
            expect(
                mergeConfigs(
                    {
                        rules: {
                            'rule-1': 'off',
                            'rule-2': ['warn'],
                            'rule-3': 'error',
                            'rule-4': ['error', { a: 'b', c: [{ d: 1, e: '2' }] }, 'aaa', NaN],
                        },
                    },
                    {
                        rules: {
                            'rule-1': 'off',
                            'rule-5': ['warn', { a: 1, b: 2 }],
                        },
                    },
                ),
            ).toMatchObject({
                rules: {
                    'rule-1': 'off',
                    'rule-2': ['warn'],
                    'rule-3': 'error',
                    'rule-4': ['error', { a: 'b', c: [{ d: 1, e: '2' }] }, 'aaa', NaN],
                    'rule-5': ['warn', { a: 1, b: 2 }],
                },
            });
        });
    });

    const assertSuperStruct = (value: unknown) => {
        assert(value, linterConfigSchema);
    };
    const assertJsonSchema = (value: unknown): void => {
        const ajv = new Ajv({ strictTuples: false });
        const validate = ajv.compile(linterConfigJsonSchema);
        const valid = validate(value);
        if (!valid) {
            throw new Error(`json schema validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
        }
    };

    test.each([
        { assertFunc: assertSuperStruct, validatorType: 'Superstruct' },
        { assertFunc: assertJsonSchema, validatorType: 'JSON schema' },
    ])('check custom $validatorType validation', ({ assertFunc }) => {
        // Valid cases
        expect(() => assertFunc({})).not.toThrowError();

        expect(() => assertFunc({ allowInlineConfig: true })).not.toThrowError();
        expect(() => assertFunc({ allowInlineConfig: false })).not.toThrowError();

        expect(() => assertFunc({ rules: {} })).not.toThrowError();
        expect(() => assertFunc(
            {
                rules: {
                    'rule-1': 'off',
                    'rule-2': ['warn'],
                    'rule-3': 'error',
                    'rule-4': ['error', { a: 'b', c: [{ d: 1, e: '2' }] }, 'aaa', NaN],
                },
            },
        )).not.toThrowError();

        // Invalid cases
        expect(() => assertFunc(null)).toThrowError();

        expect(() => assertFunc({ allowInlineConfig: 'a' })).toThrowError();
        expect(() => assertFunc({ allowInlineConfig: 2 })).toThrowError();

        expect(() => assertFunc(
            {
                rules: 'aaa',
            },
        )).toThrowError();
    });
});
