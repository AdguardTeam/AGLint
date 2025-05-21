import { describe, test, expect } from 'vitest';

import { validateLinterConfig } from '../../src/linter/config-validator';

describe('validateLinterConfig', () => {
    test('should throw an error if the config object is not valid', () => {
        // Unknown config option
        expect(() => validateLinterConfig({ unknownConfigOption: true })).toThrowError(
            'Invalid linter config: "unknownConfigOption" is unknown in the config schema, please remove it',
        );

        // Invalid value
        expect(() => validateLinterConfig({ rules: false })).toThrowError(
            'Invalid linter config: Value "false" for "rules" is not a valid "record" type',
        );
    });

    test('should not throw an error if the config object is valid', () => {
        // Empty config - currently there is no required config option
        expect(() => validateLinterConfig({ rules: {} })).not.toThrowError();

        // Simple config
        expect(() => validateLinterConfig({ allowInlineConfig: true, rules: {} })).not.toThrowError();

        // Complex config
        expect(() => {
            validateLinterConfig({
                allowInlineConfig: true,
                rules: {
                    'rule-1': ['warn', 'value-1', 'value-2'],
                    'rule-2': ['error', 'value-1', 'value-2'],
                    'rule-3': 'off',
                    'rule-4': 2,
                },
            });
        }).not.toThrowError();
    });
});
