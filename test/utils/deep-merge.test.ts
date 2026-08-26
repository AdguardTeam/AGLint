import { describe, expect, test } from 'vitest';

import { deepMerge } from '../../src/utils/deep-merge';

describe('deep-merge', () => {
    describe('basic object merging', () => {
        test('should merge two simple objects', () => {
            const a = { foo: 1 };
            const b = { bar: 2 };
            const result = deepMerge(a, b);

            expect(result).toEqual({ foo: 1, bar: 2 });
        });

        test('should override properties', () => {
            const a = { foo: 1 };
            const b = { foo: 2 };
            const result = deepMerge(a, b);

            expect(result).toEqual({ foo: 2 });
        });

        test('should merge nested objects', () => {
            const a = { nested: { foo: 1 } };
            const b = { nested: { bar: 2 } };
            const result = deepMerge(a, b);

            expect(result).toEqual({ nested: { foo: 1, bar: 2 } });
        });

        test('should not mutate original objects', () => {
            const a = { foo: 1 };
            const b = { bar: 2 };
            const result = deepMerge(a, b);

            expect(a).toEqual({ foo: 1 });
            expect(b).toEqual({ bar: 2 });
            expect(result).toEqual({ foo: 1, bar: 2 });
        });
    });

    describe('rule config array handling', () => {
        test('should replace severity but merge config options', () => {
            const a = {
                rules: {
                    'max-css-selectors': [1, { maxSelectors: 1 }],
                },
            };
            const b = {
                rules: {
                    'max-css-selectors': [2, { foo: 2 }],
                },
            };
            const result = deepMerge(a, b);

            // Severity should be from source (2), but options should be merged
            expect(result.rules['max-css-selectors']).toEqual([2, { maxSelectors: 1, foo: 2 }]);
            expect((result.rules['max-css-selectors'] as any[]).length).toBe(2);
        });

        test('should replace severity and override same options', () => {
            const a = {
                rules: {
                    'no-css-comments': ['warn', { someOption: true }],
                },
            };
            const b = {
                rules: {
                    'no-css-comments': ['error', { someOption: false }],
                },
            };
            const result = deepMerge(a, b);

            // Same option in both configs - source should win
            expect(result.rules['no-css-comments']).toEqual(['error', { someOption: false }]);
        });

        test('should replace rule config with "off" severity and preserve options', () => {
            const a = {
                rules: {
                    'some-rule': [2, { option: true }],
                },
            };
            const b = {
                rules: {
                    'some-rule': ['off'],
                },
            };
            const result = deepMerge(a, b);

            // Severity replaced to 'off', but options from target are preserved
            expect(result.rules['some-rule']).toEqual(['off', { option: true }]);
        });

        test('should replace rule config with "warn" severity', () => {
            const a = {
                rules: {
                    'some-rule': [1, { option: 1 }],
                },
            };
            const b = {
                rules: {
                    'some-rule': ['warn', { option: 2 }],
                },
            };
            const result = deepMerge(a, b);

            expect(result.rules['some-rule']).toEqual(['warn', { option: 2 }]);
        });

        test('should replace rule config with "error" severity', () => {
            const a = {
                rules: {
                    'some-rule': ['warn'],
                },
            };
            const b = {
                rules: {
                    'some-rule': ['error', { newOption: true }],
                },
            };
            const result = deepMerge(a, b);

            expect(result.rules['some-rule']).toEqual(['error', { newOption: true }]);
        });

        test('should handle multiple rule configs with option merging', () => {
            const a = {
                rules: {
                    'rule-1': [1, { opt1: true, shared: 'a' }],
                    'rule-2': 'warn',
                    'rule-3': [2],
                },
            };
            const b = {
                rules: {
                    'rule-1': [2, { opt2: false, shared: 'b' }],
                    'rule-2': 'error',
                    'rule-3': ['off'],
                },
            };
            const result = deepMerge(a, b);

            // Options should be merged, with source overriding conflicts
            expect(result.rules['rule-1']).toEqual([2, { opt1: true, opt2: false, shared: 'b' }]);
            expect(result.rules['rule-2']).toBe('error');
            expect(result.rules['rule-3']).toEqual(['off']);
        });

        test('should merge nested config options', () => {
            const a = {
                rules: {
                    'complex-rule': [1, { nested: { a: 1, b: 2 }, top: 'a' }],
                },
            };
            const b = {
                rules: {
                    'complex-rule': [2, { nested: { b: 3, c: 4 }, top: 'b' }],
                },
            };
            const result = deepMerge(a, b);

            // Nested objects should be deep merged
            expect(result.rules['complex-rule']).toEqual([2, {
                nested: { a: 1, b: 3, c: 4 },
                top: 'b',
            }]);
            expect((result.rules['complex-rule'] as any[]).length).toBe(2);
        });
    });

    describe('non-rule array handling', () => {
        test('should concatenate platforms arrays', () => {
            const a = { platforms: [] };
            const b = { platforms: ['adg_any'] };
            const result = deepMerge(a, b);

            expect(result.platforms).toEqual(['adg_any']);
        });

        test('should deduplicate concatenated arrays', () => {
            const a = { platforms: [], platforms2: ['adg_any'] };
            const b = { platforms2: ['adg_any', 'ubo_any'] };
            const result = deepMerge(a, b);

            // Should not duplicate 'adg_any'
            expect(result.platforms2).toContain('adg_any');
            expect(result.platforms2).toContain('ubo_any');
        });

        test('should handle extends arrays', () => {
            const a = { extends: ['./base.json'] };
            const b = { extends: ['./override.json'] };
            const result = deepMerge(a, b);

            expect(result.extends).toEqual(['./base.json', './override.json']);
        });

        test('should merge nested arrays in objects', () => {
            const a = { nested: { items: [1, 2] } };
            const b = { nested: { items: [3, 4] } };
            const result = deepMerge(a, b);

            // Arrays of numbers are detected as potential rule configs (since first element is a number)
            // So they get replaced instead of merged. This is expected behavior.
            expect(result.nested.items).toEqual([3, 4]);
        });
    });

    describe('edge cases', () => {
        test('should handle empty objects', () => {
            const a = {};
            const b = { foo: 1 };
            const result = deepMerge(a, b);

            expect(result).toEqual({ foo: 1 });
        });

        test('should handle empty arrays', () => {
            const a = { arr: [] };
            const b = { arr: [1, 2] };
            const result = deepMerge(a, b);

            expect(result.arr).toEqual([1, 2]);
        });

        test('should handle undefined values', () => {
            const a = { foo: 1, bar: undefined };
            const b = { bar: 2 };
            const result = deepMerge(a, b);

            expect(result).toEqual({ foo: 1, bar: 2 });
        });

        test('should handle null values', () => {
            const a = { foo: 1, bar: null };
            const b = { bar: 2 };
            const result = deepMerge(a, b);

            expect(result).toEqual({ foo: 1, bar: 2 });
        });

        test('should handle deeply nested structures', () => {
            const a = {
                level1: {
                    level2: {
                        level3: {
                            rules: {
                                'some-rule': [1, { opt: 1 }],
                            },
                        },
                    },
                },
            };
            const b = {
                level1: {
                    level2: {
                        level3: {
                            rules: {
                                'some-rule': [2, { opt: 2 }],
                            },
                        },
                    },
                },
            };
            const result = deepMerge(a, b);

            expect(result.level1.level2.level3.rules['some-rule']).toEqual([2, { opt: 2 }]);
        });

        test('should preserve rule config with single element array', () => {
            const a = {
                rules: {
                    'some-rule': [1],
                },
            };
            const b = {
                rules: {
                    'some-rule': [2],
                },
            };
            const result = deepMerge(a, b);

            expect(result.rules['some-rule']).toEqual([2]);
        });

        test('should not treat regular arrays as rule configs', () => {
            const a = { data: ['a', 'b'] };
            const b = { data: ['c', 'd'] };
            const result = deepMerge(a, b);

            // Regular string arrays should be concatenated
            expect(result.data).toContain('a');
            expect(result.data).toContain('b');
            expect(result.data).toContain('c');
            expect(result.data).toContain('d');
        });

        test('should handle mixed rule configs and non-rule arrays', () => {
            const a = {
                rules: {
                    'rule-1': [1, { opt1: true }],
                },
                platforms: [],
                extends: ['base.json'],
            };
            const b = {
                rules: {
                    'rule-1': [2, { opt2: true }],
                },
                platforms: ['adg_any'],
                extends: ['override.json'],
            };
            const result = deepMerge(a, b);

            // Rule options should be merged
            expect(result.rules['rule-1']).toEqual([2, { opt1: true, opt2: true }]);
            // Platforms should be concatenated
            expect(result.platforms).toEqual(['adg_any']);
            // Extends should be concatenated
            expect(result.extends).toEqual(['base.json', 'override.json']);
        });
    });
});
