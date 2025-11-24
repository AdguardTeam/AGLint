import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { ConfigResolver, InvalidConfigError, PresetResolver } from '../../../src/cli/utils/config-resolver';
import { NodeFileSystemAdapter } from '../../../src/cli/utils/fs-adapter';
import { NodePathAdapter } from '../../../src/cli/utils/path-adapter';
import { type ConfigChainEntry } from '../../../src/cli/utils/tree-builder';
import { type LinterConfig } from '../../../src/linter/config';
import { LinterRuleSeverity } from '../../../src/linter/rule';

describe('config-resolver', () => {
    let testDir: string;
    let presetsDir: string;
    let fs: NodeFileSystemAdapter;
    let pathAdapter: NodePathAdapter;

    beforeAll(async () => {
        // Create temporary directories
        testDir = join(tmpdir(), `aglint-config-resolver-test-${Date.now()}`);
        presetsDir = join(testDir, 'presets');
        await mkdir(presetsDir, { recursive: true });

        // Create preset files
        await writeFile(
            join(presetsDir, 'recommended.json'),
            JSON.stringify({
                syntax: ['Common'],
                rules: {
                    'no-duplicated-modifiers': 'error',
                },
            }),
        );

        await writeFile(
            join(presetsDir, 'all.json'),
            JSON.stringify({
                syntax: ['AdGuard', 'UblockOrigin'],
                rules: {
                    'no-duplicated-modifiers': 'error',
                    'no-invalid-modifiers': 'error',
                },
            }),
        );

        // Create test config files
        await writeFile(
            join(testDir, 'simple.json'),
            JSON.stringify({
                syntax: ['Common'],
                rules: {
                    'no-duplicated-modifiers': 'warn',
                },
            }),
        );

        await writeFile(
            join(testDir, 'root.json'),
            JSON.stringify({
                root: true,
                syntax: ['Common'],
            }),
        );

        await writeFile(
            join(testDir, 'with-extends.json'),
            JSON.stringify({
                extends: ['./simple.json'],
                rules: {
                    'no-invalid-modifiers': 'error',
                },
            }),
        );

        await writeFile(
            join(testDir, 'with-preset.json'),
            JSON.stringify({
                extends: ['aglint:recommended'],
                rules: {
                    'no-invalid-modifiers': 'warn',
                },
            }),
        );

        await writeFile(
            join(testDir, 'chain-a.json'),
            JSON.stringify({
                extends: ['./chain-b.json'],
                rules: {
                    'rule-a': 'error',
                },
            }),
        );

        await writeFile(
            join(testDir, 'chain-b.json'),
            JSON.stringify({
                extends: ['./chain-c.json'],
                rules: {
                    'rule-b': 'warn',
                },
            }),
        );

        await writeFile(
            join(testDir, 'chain-c.json'),
            JSON.stringify({
                rules: {
                    'rule-c': 'off',
                },
            }),
        );

        // Create circular reference configs
        await writeFile(
            join(testDir, 'circular-a.json'),
            JSON.stringify({
                extends: ['./circular-b.json'],
            }),
        );

        await writeFile(
            join(testDir, 'circular-b.json'),
            JSON.stringify({
                extends: ['./circular-a.json'],
            }),
        );

        // Create YAML config
        await writeFile(
            join(testDir, 'config.yaml'),
            'syntax:\n  - Common\nrules:\n  no-duplicated-modifiers: error\n',
        );

        await writeFile(
            join(testDir, 'config.yml'),
            'syntax:\n  - AdGuard\nrules:\n  no-invalid-modifiers: warn\n',
        );

        // Create .aglintrc without extension
        await writeFile(
            join(testDir, '.aglintrc'),
            JSON.stringify({
                syntax: ['UblockOrigin'],
            }),
        );

        // Create config with extends without extension
        await writeFile(
            join(testDir, 'no-ext-extends.json'),
            JSON.stringify({
                extends: ['./simple'],
            }),
        );

        // Create invalid JSON config
        await writeFile(
            join(testDir, 'invalid.json'),
            'not valid json {',
        );

        // Create config with multiple extends
        await writeFile(
            join(testDir, 'multi-extends.json'),
            JSON.stringify({
                extends: ['./simple.json', './root.json'],
                rules: {
                    'multi-rule': 'error',
                },
            }),
        );

        // Create subdirectories for package.json tests
        const pkgDir = join(testDir, 'pkg');
        const pkgNoAglintDir = join(testDir, 'pkg-no-aglint');
        const pkgExtendsDir = join(testDir, 'pkg-extends');
        const pkgPresetDir = join(testDir, 'pkg-preset');
        const pkgRootDir = join(testDir, 'pkg-root');

        await mkdir(pkgDir, { recursive: true });
        await mkdir(pkgNoAglintDir, { recursive: true });
        await mkdir(pkgExtendsDir, { recursive: true });
        await mkdir(pkgPresetDir, { recursive: true });
        await mkdir(pkgRootDir, { recursive: true });

        // Create package.json with aglint config
        await writeFile(
            join(pkgDir, 'package.json'),
            JSON.stringify({
                name: 'test-package',
                version: '1.0.0',
                aglint: {
                    syntax: ['Common'],
                    rules: {
                        'no-duplicated-modifiers': 'error',
                    },
                },
            }),
        );

        // Create package.json without aglint property
        await writeFile(
            join(pkgNoAglintDir, 'package.json'),
            JSON.stringify({
                name: 'test-package-no-config',
                version: '1.0.0',
            }),
        );

        // Create package.json with aglint config and extends
        await writeFile(
            join(pkgExtendsDir, 'package.json'),
            JSON.stringify({
                name: 'test-package-extends',
                version: '1.0.0',
                aglint: {
                    extends: ['../simple.json'],
                    rules: {
                        'no-invalid-modifiers': 'warn',
                    },
                },
            }),
        );

        // Create package.json with aglint config using preset
        await writeFile(
            join(pkgPresetDir, 'package.json'),
            JSON.stringify({
                name: 'test-package-preset',
                version: '1.0.0',
                aglint: {
                    extends: ['aglint:recommended'],
                    syntax: ['AdGuard'],
                },
            }),
        );

        // Create package.json with root config
        await writeFile(
            join(pkgRootDir, 'package.json'),
            JSON.stringify({
                name: 'test-package-root',
                version: '1.0.0',
                aglint: {
                    root: true,
                    syntax: ['UblockOrigin'],
                },
            }),
        );

        fs = new NodeFileSystemAdapter();
        pathAdapter = new NodePathAdapter();
    });

    afterAll(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe('PresetResolver', () => {
        test('should resolve existing preset', async () => {
            const resolver = new PresetResolver(fs, pathAdapter, presetsDir);
            const path = await resolver.resolve('recommended');

            expect(path).toContain('recommended.json');
            expect(path).toContain(presetsDir);
        });

        test('should resolve all preset', async () => {
            const resolver = new PresetResolver(fs, pathAdapter, presetsDir);
            const path = await resolver.resolve('all');

            expect(path).toContain('all.json');
        });

        test('should throw InvalidConfigError for non-existent preset', async () => {
            const resolver = new PresetResolver(fs, pathAdapter, presetsDir);

            await expect(
                resolver.resolve('nonexistent'),
            ).rejects.toThrow(InvalidConfigError);
        });

        test('should throw InvalidConfigError with preset path in message', async () => {
            const resolver = new PresetResolver(fs, pathAdapter, presetsDir);

            try {
                await resolver.resolve('missing');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(InvalidConfigError);
                expect((error as InvalidConfigError).message).toContain('missing');
                expect((error as InvalidConfigError).filePath).toContain(presetsDir);
            }
        });

        test('should return POSIX paths', async () => {
            const resolver = new PresetResolver(fs, pathAdapter, presetsDir);
            const path = await resolver.resolve('recommended');

            expect(path).not.toContain('\\');
            expect(path).toContain('/');
        });
    });

    describe('ConfigResolver', () => {
        describe('constructor', () => {
            test('should initialize with options', () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                expect(resolver).toBeDefined();
            });

            test('should initialize with base config', () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                    baseConfig: {
                        syntax: ['Common'],
                    },
                });

                expect(resolver).toBeDefined();
            });
        });

        describe('resolve', () => {
            test('should resolve simple config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'simple.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Warning);
            });

            test('should resolve config with extends', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'with-extends.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Warning);
                expect(config.rules?.['no-invalid-modifiers']).toBe(LinterRuleSeverity.Error);
            });

            test('should resolve config with preset reference', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'with-preset.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Error);
                expect(config.rules?.['no-invalid-modifiers']).toBe(LinterRuleSeverity.Warning);
            });

            test('should resolve config chain', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'chain-a.json'));

                expect(config).toBeDefined();
                expect(config.rules?.['rule-a']).toBe(LinterRuleSeverity.Error);
                expect(config.rules?.['rule-b']).toBe(LinterRuleSeverity.Warning);
                expect(config.rules?.['rule-c']).toBe(LinterRuleSeverity.Off);
            });

            test('should resolve config with multiple extends', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'multi-extends.json'));

                expect(config).toBeDefined();
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Warning);
                expect(config.rules?.['multi-rule']).toBe(LinterRuleSeverity.Error);
            });

            test('should resolve extends without extension', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'no-ext-extends.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
            });

            test('should cache resolved configs', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config1 = await resolver.resolve(join(testDir, 'simple.json'));
                const config2 = await resolver.resolve(join(testDir, 'simple.json'));

                expect(config1).toBe(config2);
            });

            test('should detect circular references', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                await expect(
                    resolver.resolve(join(testDir, 'circular-a.json')),
                ).rejects.toThrow('Circular "extends" detected');
            });

            test('should parse YAML config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'config.yaml'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
                // YAML parsed values are transformed by schema, 'error' becomes LinterRuleSeverity.Error (2)
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Error);
            });

            test('should parse YML config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'config.yml'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['AdGuard']);
            });

            test('should parse .aglintrc without extension', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, '.aglintrc'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['UblockOrigin']);
            });

            test('should throw InvalidConfigError for invalid JSON', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                await expect(
                    resolver.resolve(join(testDir, 'invalid.json')),
                ).rejects.toThrow(InvalidConfigError);
            });

            test('should throw error for non-existent file', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                await expect(
                    resolver.resolve(join(testDir, 'nonexistent.json')),
                ).rejects.toThrow();
            });

            test('should handle relative paths correctly', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'simple.json'));

                expect(config).toBeDefined();
            });

            test('should exclude root and extends from resolved config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'with-extends.json'));

                expect(config).not.toHaveProperty('extends');
                expect(config).not.toHaveProperty('root');
            });
        });

        describe('isRoot', () => {
            test('should return true for root config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const isRoot = await resolver.isRoot(join(testDir, 'root.json'));

                expect(isRoot).toBe(true);
            });

            test('should return false for non-root config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const isRoot = await resolver.isRoot(join(testDir, 'simple.json'));

                expect(isRoot).toBe(false);
            });

            test('should cache root check', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                // First call reads and caches
                await resolver.isRoot(join(testDir, 'root.json'));
                // Second call should use cache
                const isRoot = await resolver.isRoot(join(testDir, 'root.json'));

                expect(isRoot).toBe(true);
            });

            test('should handle config with extends when checking root', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const isRoot = await resolver.isRoot(join(testDir, 'with-extends.json'));

                expect(isRoot).toBe(false);
            });
        });

        describe('resolveChain', () => {
            test('should return base config for empty chain', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                    baseConfig: {
                        syntax: ['Base' as any],
                    },
                });

                const config = await resolver.resolveChain([]);

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Base']);
            });

            test('should merge config chain from root to closest', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const chain: ConfigChainEntry[] = [
                    {
                        path: join(testDir, 'child.json'),
                        directory: testDir,
                        config: {
                            syntax: ['Child' as any],
                            rules: {
                                'child-rule': 'error',
                            },
                        } as LinterConfig,
                        isRoot: false,
                    },
                    {
                        path: join(testDir, 'parent.json'),
                        directory: testDir,
                        config: {
                            syntax: ['Parent' as any],
                            rules: {
                                'parent-rule': 'warn',
                            },
                        } as unknown as LinterConfig,
                        isRoot: true,
                    },
                ];

                const config = await resolver.resolveChain(chain);

                expect(config.syntax).toEqual(['Parent', 'Child']);
                expect(config.rules?.['child-rule']).toBe('error');
                expect(config.rules?.['parent-rule']).toBe('warn');
            });

            test('should apply base config before chain', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                    baseConfig: {
                        syntax: ['Base' as any],
                        rules: {
                            'base-rule': 'off',
                        },
                    },
                });

                const chain: ConfigChainEntry[] = [
                    {
                        path: join(testDir, 'override.json'),
                        directory: testDir,
                        config: {
                            rules: {
                                'override-rule': 'error',
                            },
                        } as LinterConfig,
                        isRoot: false,
                    },
                ];

                const config = await resolver.resolveChain(chain);

                expect(config.syntax).toEqual(['Base']);
                expect(config.rules?.['base-rule']).toBe('off');
                expect(config.rules?.['override-rule']).toBe('error');
            });

            test('should handle single entry chain', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const chain: ConfigChainEntry[] = [
                    {
                        path: join(testDir, 'single.json'),
                        directory: testDir,
                        config: {
                            syntax: ['Single' as any],
                        } as LinterConfig,
                        isRoot: true,
                    },
                ];

                const config = await resolver.resolveChain(chain);

                expect(config.syntax).toEqual(['Single']);
            });

            test('should override rules correctly in chain', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const chain: ConfigChainEntry[] = [
                    {
                        path: join(testDir, 'child.json'),
                        directory: testDir,
                        config: {
                            rules: {
                                'shared-rule': 'error',
                            },
                        } as LinterConfig,
                        isRoot: false,
                    },
                    {
                        path: join(testDir, 'parent.json'),
                        directory: testDir,
                        config: {
                            rules: {
                                'shared-rule': 'warn',
                            },
                        } as LinterConfig,
                        isRoot: true,
                    },
                ];

                const config = await resolver.resolveChain(chain);

                expect(config.rules?.['shared-rule']).toBe('error');
            });
        });

        describe('invalidate', () => {
            test('should invalidate cache for specific config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const configPath = join(testDir, 'simple.json');
                const config1 = await resolver.resolve(configPath);

                resolver.invalidate(configPath);

                const config2 = await resolver.resolve(configPath);

                expect(config1).not.toBe(config2);
            });

            test('should handle invalidating non-cached config', () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                expect(() => {
                    resolver.invalidate(join(testDir, 'simple.json'));
                }).not.toThrow();
            });

            test('should normalize path when invalidating', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const configPath = join(testDir, 'simple.json');
                await resolver.resolve(configPath);

                // Invalidate with relative path
                resolver.invalidate('simple.json');

                const config = await resolver.resolve(configPath);
                expect(config).toBeDefined();
            });
        });

        describe('clearCache', () => {
            test('should clear all cached configs', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config1a = await resolver.resolve(join(testDir, 'simple.json'));
                const config2a = await resolver.resolve(join(testDir, 'root.json'));

                resolver.clearCache();

                const config1b = await resolver.resolve(join(testDir, 'simple.json'));
                const config2b = await resolver.resolve(join(testDir, 'root.json'));

                expect(config1a).not.toBe(config1b);
                expect(config2a).not.toBe(config2b);
            });

            test('should not throw when clearing empty cache', () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                expect(() => {
                    resolver.clearCache();
                }).not.toThrow();
            });
        });

        describe('edge cases', () => {
            test('should handle config with empty rules', async () => {
                await writeFile(
                    join(testDir, 'empty-rules.json'),
                    JSON.stringify({
                        syntax: ['Common'],
                        rules: {},
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'empty-rules.json'));

                expect(config).toBeDefined();
                expect(config.rules).toBeDefined();
            });

            test('should handle config with no rules', async () => {
                await writeFile(
                    join(testDir, 'no-rules.json'),
                    JSON.stringify({
                        syntax: ['Common'],
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'no-rules.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
            });

            test('should handle Windows paths', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'simple.json'));

                expect(config).toBeDefined();
            });

            test('should handle config with empty extends array', async () => {
                await writeFile(
                    join(testDir, 'empty-extends.json'),
                    JSON.stringify({
                        extends: [],
                        syntax: ['Common'],
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'empty-extends.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
            });

            test('should handle deeply nested extends', async () => {
                await writeFile(
                    join(testDir, 'deep-1.json'),
                    JSON.stringify({
                        extends: ['./deep-2.json'],
                        rules: { 'rule-1': 'error' },
                    }),
                );
                await writeFile(
                    join(testDir, 'deep-2.json'),
                    JSON.stringify({
                        extends: ['./deep-3.json'],
                        rules: { 'rule-2': 'warn' },
                    }),
                );
                await writeFile(
                    join(testDir, 'deep-3.json'),
                    JSON.stringify({
                        extends: ['./deep-4.json'],
                        rules: { 'rule-3': 'off' },
                    }),
                );
                await writeFile(
                    join(testDir, 'deep-4.json'),
                    JSON.stringify({
                        rules: { 'rule-4': 'error' },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'deep-1.json'));

                expect(config.rules?.['rule-1']).toBe(LinterRuleSeverity.Error);
                expect(config.rules?.['rule-2']).toBe(LinterRuleSeverity.Warning);
                expect(config.rules?.['rule-3']).toBe(LinterRuleSeverity.Off);
                expect(config.rules?.['rule-4']).toBe(LinterRuleSeverity.Error);
            });
        });

        describe('package.json support', () => {
            test('should resolve package.json with aglint property', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'pkg', 'package.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Error);
            });

            test('should throw InvalidConfigError for package.json without aglint property', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                await expect(
                    resolver.resolve(join(testDir, 'pkg-no-aglint', 'package.json')),
                ).rejects.toThrow(InvalidConfigError);
            });

            test('should resolve package.json with extends', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'pkg-extends', 'package.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common']);
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Warning);
                expect(config.rules?.['no-invalid-modifiers']).toBe(LinterRuleSeverity.Warning);
            });

            test('should resolve package.json with preset reference', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'pkg-preset', 'package.json'));

                expect(config).toBeDefined();
                expect(config.syntax).toEqual(['Common', 'AdGuard']);
                expect(config.rules?.['no-duplicated-modifiers']).toBe(LinterRuleSeverity.Error);
            });

            test('should check root flag in package.json', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const isRoot = await resolver.isRoot(join(testDir, 'pkg-root', 'package.json'));

                expect(isRoot).toBe(true);
            });

            test('should return false for non-root package.json', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const isRoot = await resolver.isRoot(join(testDir, 'pkg', 'package.json'));

                expect(isRoot).toBe(false);
            });

            test('should exclude root and extends from resolved package.json config', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'pkg-extends', 'package.json'));

                expect(config).not.toHaveProperty('extends');
                expect(config).not.toHaveProperty('root');
            });

            test('should cache package.json configs', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config1 = await resolver.resolve(join(testDir, 'pkg', 'package.json'));
                const config2 = await resolver.resolve(join(testDir, 'pkg', 'package.json'));

                expect(config1).toBe(config2);
            });
        });

        describe('rule config array merging', () => {
            test('should replace rule config array when severity changes', async () => {
                await writeFile(
                    join(testDir, 'rule-severity-base.json'),
                    JSON.stringify({
                        rules: {
                            'max-css-selectors': [1, { maxSelectors: 1 }],
                        },
                    }),
                );

                await writeFile(
                    join(testDir, 'rule-severity-override.json'),
                    JSON.stringify({
                        extends: ['./rule-severity-base.json'],
                        rules: {
                            'max-css-selectors': [2, { maxSelectors: 1 }],
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'rule-severity-override.json'));

                expect(config.rules?.['max-css-selectors']).toEqual([2, { maxSelectors: 1 }]);
                // Ensure it's NOT concatenated like [1, { maxSelectors: 1 }, 2]
                expect(Array.isArray(config.rules?.['max-css-selectors'])).toBe(true);
                expect((config.rules?.['max-css-selectors'] as any[]).length).toBe(2);
            });

            test('should merge rule config options when options change', async () => {
                await writeFile(
                    join(testDir, 'rule-options-base.json'),
                    JSON.stringify({
                        rules: {
                            'max-css-selectors': [1, { maxSelectors: 1, foo: 'bar' }],
                        },
                    }),
                );

                await writeFile(
                    join(testDir, 'rule-options-override.json'),
                    JSON.stringify({
                        extends: ['./rule-options-base.json'],
                        rules: {
                            'max-css-selectors': [1, { maxSelectors: 5 }],
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'rule-options-override.json'));

                // Options should be merged - maxSelectors overridden, foo preserved
                expect(config.rules?.['max-css-selectors']).toEqual([1, { maxSelectors: 5, foo: 'bar' }]);
            });

            test('should replace rule config with string severity', async () => {
                await writeFile(
                    join(testDir, 'rule-string-base.json'),
                    JSON.stringify({
                        rules: {
                            'no-css-comments': 'warn',
                        },
                    }),
                );

                await writeFile(
                    join(testDir, 'rule-string-override.json'),
                    JSON.stringify({
                        extends: ['./rule-string-base.json'],
                        rules: {
                            'no-css-comments': 'error',
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'rule-string-override.json'));

                // String severities are parsed to numbers by the schema
                expect(config.rules?.['no-css-comments']).toBe(LinterRuleSeverity.Error);
            });

            test('should replace rule config from string to array', async () => {
                await writeFile(
                    join(testDir, 'rule-string-to-array-base.json'),
                    JSON.stringify({
                        rules: {
                            'max-css-selectors': 'warn',
                        },
                    }),
                );

                await writeFile(
                    join(testDir, 'rule-string-to-array-override.json'),
                    JSON.stringify({
                        extends: ['./rule-string-to-array-base.json'],
                        rules: {
                            'max-css-selectors': [2, { maxSelectors: 3 }],
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'rule-string-to-array-override.json'));

                expect(config.rules?.['max-css-selectors']).toEqual([2, { maxSelectors: 3 }]);
            });

            test('should replace rule config in chain merging', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const chain: ConfigChainEntry[] = [
                    {
                        path: join(testDir, 'child.json'),
                        directory: testDir,
                        config: {
                            rules: {
                                'max-css-selectors': [2, { maxSelectors: 10 }],
                            },
                        } as LinterConfig,
                        isRoot: false,
                    },
                    {
                        path: join(testDir, 'parent.json'),
                        directory: testDir,
                        config: {
                            rules: {
                                'max-css-selectors': [1, { maxSelectors: 1 }],
                            },
                        } as LinterConfig,
                        isRoot: true,
                    },
                ];

                const config = await resolver.resolveChain(chain);

                // Child should override parent
                expect(config.rules?.['max-css-selectors']).toEqual([2, { maxSelectors: 10 }]);
            });

            test('should handle multiple rule config overrides with option merging', async () => {
                await writeFile(
                    join(testDir, 'multi-rule-base.json'),
                    JSON.stringify({
                        rules: {
                            'max-css-selectors': [1, { maxSelectors: 1, keepThis: true }],
                            'no-short-rules': [1, { minLength: 5 }],
                            'no-css-comments': 'warn',
                        },
                    }),
                );

                await writeFile(
                    join(testDir, 'multi-rule-override.json'),
                    JSON.stringify({
                        extends: ['./multi-rule-base.json'],
                        rules: {
                            'max-css-selectors': [2, { maxSelectors: 3 }],
                            'no-short-rules': 'error',
                            'no-css-comments': [2],
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'multi-rule-override.json'));

                // Options should be merged - keepThis preserved, maxSelectors overridden
                expect(config.rules?.['max-css-selectors']).toEqual([2, { maxSelectors: 3, keepThis: true }]);
                // String severities are parsed to numbers by the schema
                expect(config.rules?.['no-short-rules']).toBe(LinterRuleSeverity.Error);
                expect(config.rules?.['no-css-comments']).toEqual([2]);
            });

            test('should still concatenate syntax arrays correctly', async () => {
                await writeFile(
                    join(testDir, 'syntax-base.json'),
                    JSON.stringify({
                        syntax: ['Common'],
                    }),
                );

                await writeFile(
                    join(testDir, 'syntax-override.json'),
                    JSON.stringify({
                        extends: ['./syntax-base.json'],
                        syntax: ['AdGuard'],
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'syntax-override.json'));

                // Syntax arrays should be merged (concatenated with deduplication)
                expect(config.syntax).toEqual(['Common', 'AdGuard']);
            });

            test('should handle rule config with off severity', async () => {
                await writeFile(
                    join(testDir, 'rule-off-base.json'),
                    JSON.stringify({
                        rules: {
                            'no-css-comments': [2, { someOption: true }],
                        },
                    }),
                );

                await writeFile(
                    join(testDir, 'rule-off-override.json'),
                    JSON.stringify({
                        extends: ['./rule-off-base.json'],
                        rules: {
                            'no-css-comments': 'off',
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const config = await resolver.resolve(join(testDir, 'rule-off-override.json'));

                // String severities are parsed to numbers by the schema
                expect(config.rules?.['no-css-comments']).toBe(LinterRuleSeverity.Off);
            });
        });

        describe('InvalidConfigError', () => {
            test('should throw InvalidConfigError for invalid JSON with filename', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const invalidPath = join(testDir, 'invalid.json');

                try {
                    await resolver.resolve(invalidPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).filePath).toBe(pathAdapter.toPosix(invalidPath));
                    expect((error as InvalidConfigError).message).toContain(invalidPath);
                    expect((error as InvalidConfigError).message).toContain('Invalid JSON');
                }
            });

            test('should throw InvalidConfigError with property path for schema validation errors', async () => {
                await writeFile(
                    join(testDir, 'invalid-schema.json'),
                    JSON.stringify({
                        syntax: 'not-an-array', // Should be an array
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const invalidPath = join(testDir, 'invalid-schema.json');

                try {
                    await resolver.resolve(invalidPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).filePath).toBe(pathAdapter.toPosix(invalidPath));
                    expect((error as InvalidConfigError).propertyPath).toBeDefined();
                    expect((error as InvalidConfigError).message).toContain(invalidPath);
                }
            });

            test('should throw InvalidConfigError for invalid rules in config', async () => {
                await writeFile(
                    join(testDir, 'invalid-rules.json'),
                    JSON.stringify({
                        rules: {
                            'some-rule': 'invalid-severity', // Should be 'off', 'warn', 'error', or 0, 1, 2
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const invalidPath = join(testDir, 'invalid-rules.json');

                try {
                    await resolver.resolve(invalidPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).filePath).toBe(pathAdapter.toPosix(invalidPath));
                    expect((error as InvalidConfigError).propertyPath).toContain('rules');
                }
            });

            test('should throw InvalidConfigError for package.json without aglint property', async () => {
                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const pkgPath = join(testDir, 'pkg-no-aglint', 'package.json');

                try {
                    await resolver.resolve(pkgPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).filePath).toBe(pathAdapter.toPosix(pkgPath));
                    expect((error as InvalidConfigError).message).toContain('No "aglint" property');
                }
            });

            test('should throw InvalidConfigError for package.json with invalid aglint schema', async () => {
                const pkgInvalidDir = join(testDir, 'pkg-invalid-schema');
                await mkdir(pkgInvalidDir, { recursive: true });

                await writeFile(
                    join(pkgInvalidDir, 'package.json'),
                    JSON.stringify({
                        name: 'test-package-invalid',
                        version: '1.0.0',
                        aglint: {
                            extends: 123, // Should be an array of strings
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const pkgPath = join(pkgInvalidDir, 'package.json');

                try {
                    await resolver.resolve(pkgPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).filePath).toBe(pathAdapter.toPosix(pkgPath));
                    expect((error as InvalidConfigError).propertyPath).toBe('aglint.extends');
                }
            });

            test('should throw InvalidConfigError for invalid YAML with filename', async () => {
                await writeFile(
                    join(testDir, 'invalid.yaml'),
                    'invalid: yaml: content: with: too: many: colons::',
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const invalidPath = join(testDir, 'invalid.yaml');

                try {
                    await resolver.resolve(invalidPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).filePath).toBe(pathAdapter.toPosix(invalidPath));
                    expect((error as InvalidConfigError).message).toContain(invalidPath);
                    expect((error as InvalidConfigError).message).toContain('Invalid YAML');
                }
            });

            test('should throw InvalidConfigError for non-existent preset with filename', async () => {
                await writeFile(
                    join(testDir, 'nonexistent-preset.json'),
                    JSON.stringify({
                        extends: ['aglint:nonexistent-preset'],
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                try {
                    await resolver.resolve(join(testDir, 'nonexistent-preset.json'));
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    expect((error as InvalidConfigError).message).toContain('Preset "nonexistent-preset" not found');
                    expect((error as InvalidConfigError).filePath).toBeDefined();
                }
            });

            test('should include property path in error message', async () => {
                await writeFile(
                    join(testDir, 'error-with-path.json'),
                    JSON.stringify({
                        rules: {
                            'test-rule': { invalid: 'object' }, // Should be string or array
                        },
                    }),
                );

                const resolver = new ConfigResolver(fs, pathAdapter, {
                    presetsRoot: presetsDir,
                });

                const configPath = join(testDir, 'error-with-path.json');

                try {
                    await resolver.resolve(configPath);
                    expect.fail('Should have thrown InvalidConfigError');
                } catch (error) {
                    expect(error).toBeInstanceOf(InvalidConfigError);
                    const err = error as InvalidConfigError;
                    expect(err.message).toContain(configPath);
                    if (err.propertyPath) {
                        expect(err.message).toContain(err.propertyPath);
                    }
                }
            });
        });
    });
});
