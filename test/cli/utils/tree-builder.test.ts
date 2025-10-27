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

import { type LinterConfigFile } from '../../../src/cli/config-file/config-file';
import { NodeFileSystemAdapter } from '../../../src/cli/utils/fs-adapter';
import { NodePathAdapter } from '../../../src/cli/utils/path-adapter';
import { IgnoreMatcher, LinterTree } from '../../../src/cli/utils/tree-builder';

describe('tree-builder', () => {
    let testDir: string;
    let fs: NodeFileSystemAdapter;
    let pathAdapter: NodePathAdapter;

    beforeAll(async () => {
        testDir = join(tmpdir(), `aglint-tree-builder-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });

        // Create test structure
        await writeFile(join(testDir, 'file1.txt'), 'content');
        await writeFile(join(testDir, 'file2.txt'), 'content');

        await mkdir(join(testDir, 'src'), { recursive: true });
        await writeFile(join(testDir, 'src', 'index.ts'), 'code');
        await writeFile(join(testDir, 'src', 'util.ts'), 'code');

        await mkdir(join(testDir, 'src', 'sub'), { recursive: true });
        await writeFile(join(testDir, 'src', 'sub', 'nested.ts'), 'code');

        // Create config files
        await writeFile(join(testDir, '.aglintrc.json'), JSON.stringify({ root: true }));
        await writeFile(join(testDir, 'src', '.aglintrc.json'), JSON.stringify({ extends: ['../.aglintrc.json'] }));

        // Create ignore files
        await writeFile(join(testDir, '.aglintignore'), 'node_modules\n*.log');
        await writeFile(join(testDir, 'src', '.aglintignore'), 'dist\ntest.ts');

        fs = new NodeFileSystemAdapter();
        pathAdapter = new NodePathAdapter();
    });

    afterAll(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe('LinterTree', () => {
        describe('constructor', () => {
            test('should initialize with root directory', () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                const rootNode = tree.getNode(testDir);
                expect(rootNode).toBeDefined();
                expect(rootNode?.path).toContain(testDir);
                expect(rootNode?.parent).toBeUndefined();
            });
        });

        describe('addFile', () => {
            test('should add file to root directory', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                const filePath = join(testDir, 'file1.txt');
                await tree.addFile(filePath);

                const rootNode = tree.getNode(testDir);
                expect(rootNode?.files.has(filePath)).toBe(true);
            });

            test('should add file to nested directory', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                const filePath = join(testDir, 'src', 'index.ts');
                await tree.addFile(filePath);

                const srcNode = tree.getNode(join(testDir, 'src'));
                expect(srcNode?.files.has(filePath)).toBe(true);
            });

            test('should create intermediate directories', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                const filePath = join(testDir, 'src', 'sub', 'nested.ts');
                await tree.addFile(filePath);

                const srcNode = tree.getNode(join(testDir, 'src'));
                const subNode = tree.getNode(join(testDir, 'src', 'sub'));

                expect(srcNode).toBeDefined();
                expect(subNode).toBeDefined();
                expect(subNode?.parent).toBe(srcNode);
                expect(subNode?.files.has(filePath)).toBe(true);
            });

            test('should detect config files', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));

                const rootNode = tree.getNode(testDir);
                expect(rootNode?.configFiles.length).toBeGreaterThan(0);
                expect(rootNode?.configFiles[0]).toContain('.aglintrc.json');
            });

            test('should detect ignore files', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));

                const rootNode = tree.getNode(testDir);
                expect(rootNode?.ignoreFile).toContain('.aglintignore');
            });
        });

        describe('getIgnoreChain', () => {
            test('should return empty chain when no ignore files', async () => {
                const emptyDir = join(tmpdir(), `aglint-empty-test-${Date.now()}`);
                await mkdir(emptyDir, { recursive: true });

                const tree = new LinterTree(fs, pathAdapter, {
                    root: emptyDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                try {
                    const chain = await tree.getIgnoreChain(emptyDir);
                    expect(chain).toHaveLength(0);
                } finally {
                    await rm(emptyDir, { recursive: true, force: true });
                }
            });

            test('should return chain with root ignore file', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));
                const chain = await tree.getIgnoreChain(testDir);

                expect(chain.length).toBeGreaterThan(0);
                expect(chain[0]?.patterns).toContain('node_modules');
                expect(chain[0]?.patterns).toContain('*.log');
            });

            test('should return chain with nested ignore files', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const chain = await tree.getIgnoreChain(join(testDir, 'src'));

                expect(chain.length).toBe(2);
                expect(chain[0]?.patterns).toContain('dist');
                expect(chain[1]?.patterns).toContain('node_modules');
            });

            test('should cache ignore chains', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const chain1 = await tree.getIgnoreChain(join(testDir, 'src'));
                const chain2 = await tree.getIgnoreChain(join(testDir, 'src'));

                expect(chain1).toBe(chain2); // Same reference
            });
        });

        describe('getConfigChain', () => {
            test('should return empty chain when no config files', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.nonexistent.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));
                const chain = await tree.getConfigChain(testDir);

                expect(chain).toHaveLength(0);
            });

            test('should work without config resolver', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const chain = await tree.getConfigChain(join(testDir, 'src'));

                expect(chain.length).toBeGreaterThan(0);
                expect(chain[0]?.config).toBeDefined();
                expect(chain[0]?.isRoot).toBe(false);
            });

            test('should return chain with config files', async () => {
                const resolver = {
                    resolve: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        return JSON.parse(content) as LinterConfigFile;
                    },
                    isRoot: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        const config = JSON.parse(content);
                        return config.root === true;
                    },
                };

                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                }, resolver);

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const chain = await tree.getConfigChain(join(testDir, 'src'));

                expect(chain.length).toBeGreaterThan(0);
                expect(chain[0]?.path).toContain('src');
            });

            test('should stop at root config', async () => {
                const resolver = {
                    resolve: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        return JSON.parse(content) as LinterConfigFile;
                    },
                    isRoot: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        const config = JSON.parse(content);
                        return config.root === true;
                    },
                };

                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                }, resolver);

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const chain = await tree.getConfigChain(join(testDir, 'src'));

                const hasRoot = chain.some((entry) => entry.isRoot);
                expect(hasRoot).toBe(true);
            });
        });

        describe('getResolvedConfig', () => {
            test('should merge config chain correctly', async () => {
                const resolver = {
                    resolve: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        return JSON.parse(content) as LinterConfigFile;
                    },
                    isRoot: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        const config = JSON.parse(content);
                        return config.root === true;
                    },
                };

                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                }, resolver);

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const config = await tree.getResolvedConfig(join(testDir, 'src'));

                expect(config).toBeDefined();
                expect(config.root).toBe(true);
            });

            test('should cache resolved config', async () => {
                const resolver = {
                    resolve: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        return JSON.parse(content) as LinterConfigFile;
                    },
                    isRoot: async (configPath: string) => {
                        const content = await fs.readFile(configPath);
                        const config = JSON.parse(content);
                        return config.root === true;
                    },
                };

                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                }, resolver);

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const config1 = await tree.getResolvedConfig(join(testDir, 'src'));
                const config2 = await tree.getResolvedConfig(join(testDir, 'src'));

                expect(config1).toBe(config2);
            });

            test('should merge extends arrays from multiple configs', async () => {
                // Create a test directory with nested configs that have extends
                const extendsTestDir = join(tmpdir(), `aglint-extends-test-${Date.now()}`);
                await mkdir(extendsTestDir, { recursive: true });

                try {
                    // Create base config files
                    await writeFile(join(extendsTestDir, 'base1.json'), JSON.stringify({}));
                    await writeFile(join(extendsTestDir, 'base2.json'), JSON.stringify({}));

                    // Create root config with extends
                    await writeFile(
                        join(extendsTestDir, '.aglintrc.json'),
                        JSON.stringify({
                            root: true,
                            extends: ['./base1.json'],
                        }),
                    );

                    // Create subdirectory with config that has extends
                    await mkdir(join(extendsTestDir, 'nested'), { recursive: true });
                    await writeFile(
                        join(extendsTestDir, 'nested', '.aglintrc.json'),
                        JSON.stringify({
                            extends: ['../base2.json'],
                        }),
                    );

                    const resolver = {
                        resolve: async (configPath: string) => {
                            const content = await fs.readFile(configPath);
                            return JSON.parse(content) as LinterConfigFile;
                        },
                        isRoot: async (configPath: string) => {
                            const content = await fs.readFile(configPath);
                            const config = JSON.parse(content);
                            return config.root === true;
                        },
                    };

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: extendsTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add file in nested directory
                    await writeFile(join(extendsTestDir, 'nested', 'test.ts'), 'code');
                    await tree.addFile(join(extendsTestDir, 'nested', 'test.ts'));

                    // Get resolved config for nested directory
                    const config = await tree.getResolvedConfig(join(extendsTestDir, 'nested'));

                    // Verify that merged config contains all extends paths from both configs
                    expect(config.extends).toBeDefined();
                    expect(config.extends).toContain('./base1.json');
                    expect(config.extends).toContain('../base2.json');
                    expect(config.extends?.length).toBe(2);
                } finally {
                    await rm(extendsTestDir, { recursive: true, force: true });
                }
            });

            test('should throw error without config resolver', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));

                await expect(
                    tree.getResolvedConfig(testDir),
                ).rejects.toThrow('Config resolver not provided');
            });
        });

        describe('isIgnored', () => {
            test('should return false for non-ignored paths', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));
                const ignored = await tree.isIgnored(join(testDir, 'file1.txt'));

                expect(ignored).toBe(false);
            });

            test('should return true for ignored patterns', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                // Create the log file to test
                const logFile = join(testDir, 'test.log');
                await writeFile(logFile, 'log content');

                await tree.addFile(join(testDir, 'file1.txt'));
                const ignored = await tree.isIgnored(logFile);

                expect(ignored).toBe(true);
            });
        });

        describe('changed', () => {
            test('should handle deleted ignore file', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));
                const rootNode = tree.getNode(testDir);
                expect(rootNode?.ignoreFile).toBeDefined();

                // Simulate deletion by notifying of a non-existent ignore file
                const tempIgnore = join(testDir, '.temp-ignore');
                await tree.changed(tempIgnore);

                // Original ignore should still be there since we changed a different file
                expect(rootNode?.ignoreFile).toBeDefined();
            });

            test('should update config file', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));
                const rootNode = tree.getNode(testDir);
                const initialConfigCount = rootNode?.configFiles.length || 0;

                await tree.changed(join(testDir, '.aglintrc.json'));

                expect(rootNode?.configFiles.length).toBe(initialConfigCount);
            });

            test('should handle config file deletion', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json', '.aglintrc.js']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));

                // Notify about a non-existent config file
                const nonExistentConfig = join(testDir, '.aglintrc.js');
                await tree.changed(nonExistentConfig);

                const rootNode = tree.getNode(testDir);
                expect(rootNode?.configFiles.includes(nonExistentConfig)).toBe(false);
            });

            test('should update ignore file', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'file1.txt'));
                await tree.changed(join(testDir, '.aglintignore'));

                const rootNode = tree.getNode(testDir);
                expect(rootNode?.ignoreFile).toBeDefined();
            });

            test('should clear caches', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                const chain1 = await tree.getIgnoreChain(join(testDir, 'src'));

                await tree.changed(join(testDir, 'src', '.aglintignore'));
                const chain2 = await tree.getIgnoreChain(join(testDir, 'src'));

                // Should be different references after cache clear
                expect(chain1).not.toBe(chain2);
            });
        });

        describe('clearCaches', () => {
            test('should clear all caches', async () => {
                const tree = new LinterTree(fs, pathAdapter, {
                    root: testDir,
                    configFileNames: new Set(['.aglintrc.json']),
                    ignoreFileName: '.aglintignore',
                });

                await tree.addFile(join(testDir, 'src', 'index.ts'));
                await tree.getIgnoreChain(join(testDir, 'src'));

                tree.clearCaches();

                const chain = await tree.getIgnoreChain(join(testDir, 'src'));
                expect(chain).toBeDefined();
            });
        });
    });

    describe('IgnoreMatcher', () => {
        test('should match ignore patterns', () => {
            const chain = [
                {
                    path: join(testDir, '.aglintignore'),
                    directory: testDir,
                    patterns: ['*.log', 'node_modules'],
                },
            ];

            const matcher = new IgnoreMatcher(pathAdapter, testDir, chain);

            expect(matcher.isIgnored(join(testDir, 'test.log'))).toBe(true);
            expect(matcher.isIgnored(join(testDir, 'node_modules'))).toBe(true);
            expect(matcher.isIgnored(join(testDir, 'file.txt'))).toBe(false);
        });

        test('should handle nested patterns', () => {
            const chain = [
                {
                    path: join(testDir, 'src', '.aglintignore'),
                    directory: join(testDir, 'src'),
                    patterns: ['dist'],
                },
                {
                    path: join(testDir, '.aglintignore'),
                    directory: testDir,
                    patterns: ['*.log'],
                },
            ];

            const matcher = new IgnoreMatcher(pathAdapter, testDir, chain);

            expect(matcher.isIgnored(join(testDir, 'src', 'dist'))).toBe(true);
            expect(matcher.isIgnored(join(testDir, 'test.log'))).toBe(true);
        });
    });
});
