import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { buildConfigForDirectory } from '../../../src/linter/cli/config-builder';
import { NoConfigError } from '../../../src/linter/cli/errors/no-config-error';

const BASE_PATH = 'test/fixtures/config-builder';

describe('buildConfigForDirectory', () => {
    test('should throw error when config file is not found', async () => {
        await expect(buildConfigForDirectory(path.join(BASE_PATH, 'invalid'))).rejects.toThrowError(
            NoConfigError,
        );
    });

    test('should return root config when it is located in the main directory', async () => {
        expect(
            await buildConfigForDirectory(path.join(BASE_PATH, 'valid')),
        ).toMatchObject({
            allowInlineConfig: true,
            rules: {
                'rule-1': 'error',
                'rule-2': 0,
                'rule-3': 'off',
                'rule-4': ['error', 'always'],
            },
        });
    });

    test('should return root config when it is located in subdirectory', async () => {
        expect(
            await buildConfigForDirectory(path.join(BASE_PATH, 'valid/another-root')),
        ).toMatchObject({
            rules: {
                'rule-1': 'warn',
            },
        });
    });

    test('should build config from hiererchy chain', async () => {
        expect(
            await buildConfigForDirectory(path.join(BASE_PATH, 'valid/config-chain')),
        ).toMatchObject({
            allowInlineConfig: true,
            rules: {
                'rule-1': 'warn',
                'rule-2': 0,
                'rule-3': 'off',
                'rule-4': ['error', 'never'],
                'rule-5': 'error',
            },
        });

        // Config file format also differs in this case (JSON vs YAML)
        expect(
            await buildConfigForDirectory(path.join(BASE_PATH, 'valid/config-chain/subdir')),
        ).toMatchObject({
            allowInlineConfig: true,
            rules: {
                'rule-1': 0,
                'rule-2': 0,
                'rule-3': 'off',
                'rule-4': ['error', 'never'],
                'rule-5': 'warn',
            },
        });
    });
});
