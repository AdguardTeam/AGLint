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

            test('should force rescan when config file is modified', async () => {
                const modifiedTestDir = join(tmpdir(), `aglint-modified-test-${Date.now()}`);
                await mkdir(modifiedTestDir, { recursive: true });

                try {
                    // Create initial config
                    await writeFile(
                        join(modifiedTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-1': 'error' } }),
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
                        root: modifiedTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add file and get initial config
                    await tree.addFile(join(modifiedTestDir, 'test.txt'));
                    const config1 = await tree.getResolvedConfig(modifiedTestDir);
                    expect(config1.rules).toEqual({ 'rule-1': 'error' });

                    // Modify the config file
                    await writeFile(
                        join(modifiedTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-2': 'warn' } }),
                    );

                    // Notify of the change
                    await tree.changed(join(modifiedTestDir, '.aglintrc.json'));

                    // Get config again - should reflect the change
                    const config2 = await tree.getResolvedConfig(modifiedTestDir);
                    expect(config2.rules).toEqual({ 'rule-2': 'warn' });
                    expect(config2.rules).not.toEqual({ 'rule-1': 'error' });
                } finally {
                    await rm(modifiedTestDir, { recursive: true, force: true });
                }
            });

            test('should force rescan when ignore file is modified', async () => {
                const modifiedTestDir = join(tmpdir(), `aglint-ignore-modified-test-${Date.now()}`);
                await mkdir(modifiedTestDir, { recursive: true });

                try {
                    // Create initial ignore file
                    await writeFile(join(modifiedTestDir, '.aglintignore'), '*.log\nnode_modules');

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: modifiedTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file and get initial ignore chain
                    await tree.addFile(join(modifiedTestDir, 'test.txt'));
                    const chain1 = await tree.getIgnoreChain(modifiedTestDir);
                    expect(chain1[0]?.patterns).toEqual(['*.log', 'node_modules']);

                    // Modify the ignore file
                    await writeFile(join(modifiedTestDir, '.aglintignore'), '*.tmp\ndist');

                    // Notify of the change
                    await tree.changed(join(modifiedTestDir, '.aglintignore'));

                    // Get chain again - should reflect the change
                    const chain2 = await tree.getIgnoreChain(modifiedTestDir);
                    expect(chain2[0]?.patterns).toEqual(['*.tmp', 'dist']);
                    expect(chain2[0]?.patterns).not.toContain('*.log');
                } finally {
                    await rm(modifiedTestDir, { recursive: true, force: true });
                }
            });

            test('should invalidate child directory caches when parent config changes', async () => {
                const cacheTestDir = join(tmpdir(), `aglint-cache-test-${Date.now()}`);
                await mkdir(join(cacheTestDir, 'nested'), { recursive: true });

                try {
                    // Create config in parent
                    await writeFile(
                        join(cacheTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-1': 'error' } }),
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
                        root: cacheTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add file in nested directory and get config
                    await writeFile(join(cacheTestDir, 'nested', 'test.txt'), 'content');
                    await tree.addFile(join(cacheTestDir, 'nested', 'test.txt'));
                    const nestedConfig1 = await tree.getResolvedConfig(join(cacheTestDir, 'nested'));
                    expect(nestedConfig1.rules).toEqual({ 'rule-1': 'error' });

                    // Modify parent config
                    await writeFile(
                        join(cacheTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-2': 'warn' } }),
                    );

                    // Notify of parent change
                    await tree.changed(join(cacheTestDir, '.aglintrc.json'));

                    // Get nested config again - should reflect parent's change
                    const nestedConfig2 = await tree.getResolvedConfig(join(cacheTestDir, 'nested'));
                    expect(nestedConfig2.rules).toEqual({ 'rule-2': 'warn' });
                } finally {
                    await rm(cacheTestDir, { recursive: true, force: true });
                }
            });

            test('should invalidate child directory ignore chains when parent ignore changes', async () => {
                const ignoreTestDir = join(tmpdir(), `aglint-ignore-chain-test-${Date.now()}`);
                await mkdir(join(ignoreTestDir, 'nested'), { recursive: true });

                try {
                    // Create ignore in parent
                    await writeFile(join(ignoreTestDir, '.aglintignore'), '*.log');

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: ignoreTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file in nested directory and get ignore chain
                    await writeFile(join(ignoreTestDir, 'nested', 'test.txt'), 'content');
                    await tree.addFile(join(ignoreTestDir, 'nested', 'test.txt'));
                    const chain1 = await tree.getIgnoreChain(join(ignoreTestDir, 'nested'));
                    expect(chain1.some((entry) => entry.patterns.includes('*.log'))).toBe(true);

                    // Modify parent ignore file
                    await writeFile(join(ignoreTestDir, '.aglintignore'), '*.tmp\ndist');

                    // Notify of parent change
                    await tree.changed(join(ignoreTestDir, '.aglintignore'));

                    // Get nested chain again - should reflect parent's change
                    const chain2 = await tree.getIgnoreChain(join(ignoreTestDir, 'nested'));
                    expect(chain2.some((entry) => entry.patterns.includes('*.tmp'))).toBe(true);
                    expect(chain2.some((entry) => entry.patterns.includes('*.log'))).toBe(false);
                } finally {
                    await rm(ignoreTestDir, { recursive: true, force: true });
                }
            });

            test('should handle adding new parent config file and invalidate children', async () => {
                const addTestDir = join(tmpdir(), `aglint-add-parent-test-${Date.now()}`);
                await mkdir(join(addTestDir, 'child1', 'child2'), { recursive: true });

                try {
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
                        root: addTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add file in deeply nested directory - no config exists yet
                    await writeFile(join(addTestDir, 'child1', 'child2', 'test.txt'), 'content');
                    await tree.addFile(join(addTestDir, 'child1', 'child2', 'test.txt'));
                    const config1 = await tree.getConfigChain(join(addTestDir, 'child1', 'child2'));
                    expect(config1.length).toBe(0); // No configs

                    // Add a config file in parent directory
                    await writeFile(
                        join(addTestDir, 'child1', '.aglintrc.json'),
                        JSON.stringify({ root: false, rules: { 'new-rule': 'error' } }),
                    );

                    // Notify of the addition
                    await tree.changed(join(addTestDir, 'child1', '.aglintrc.json'));

                    // Child should now see the parent's config
                    const config2 = await tree.getConfigChain(join(addTestDir, 'child1', 'child2'));
                    expect(config2.length).toBe(1);
                    expect(config2[0]?.config.rules).toEqual({ 'new-rule': 'error' });
                } finally {
                    await rm(addTestDir, { recursive: true, force: true });
                }
            });

            test('should handle removing parent config file and invalidate children', async () => {
                const removeTestDir = join(tmpdir(), `aglint-remove-parent-test-${Date.now()}`);
                await mkdir(join(removeTestDir, 'child'), { recursive: true });

                try {
                    // Create parent config
                    await writeFile(
                        join(removeTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-1': 'error' } }),
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
                        root: removeTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add file in child directory
                    await writeFile(join(removeTestDir, 'child', 'test.txt'), 'content');
                    await tree.addFile(join(removeTestDir, 'child', 'test.txt'));
                    const config1 = await tree.getResolvedConfig(join(removeTestDir, 'child'));
                    expect(config1.rules).toEqual({ 'rule-1': 'error' });

                    // Remove parent config file
                    await rm(join(removeTestDir, '.aglintrc.json'));

                    // Notify of the removal
                    await tree.changed(join(removeTestDir, '.aglintrc.json'));

                    // Child should no longer see parent's config
                    const config2 = await tree.getResolvedConfig(join(removeTestDir, 'child'));
                    expect(config2).toEqual({});
                } finally {
                    await rm(removeTestDir, { recursive: true, force: true });
                }
            });

            test('should handle adding parent ignore file and invalidate children', async () => {
                const addIgnoreTestDir = join(tmpdir(), `aglint-add-ignore-test-${Date.now()}`);
                await mkdir(join(addIgnoreTestDir, 'child'), { recursive: true });

                try {
                    const tree = new LinterTree(fs, pathAdapter, {
                        root: addIgnoreTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file in child directory - no ignore file exists yet
                    await writeFile(join(addIgnoreTestDir, 'child', 'test.txt'), 'content');
                    await tree.addFile(join(addIgnoreTestDir, 'child', 'test.txt'));
                    const chain1 = await tree.getIgnoreChain(join(addIgnoreTestDir, 'child'));
                    expect(chain1.length).toBe(0); // No ignore files

                    // Add ignore file in parent
                    await writeFile(join(addIgnoreTestDir, '.aglintignore'), '*.log\nnode_modules');

                    // Notify of the addition
                    await tree.changed(join(addIgnoreTestDir, '.aglintignore'));

                    // Child should now see parent's ignore patterns
                    const chain2 = await tree.getIgnoreChain(join(addIgnoreTestDir, 'child'));
                    expect(chain2.length).toBe(1);
                    expect(chain2[0]?.patterns).toEqual(['*.log', 'node_modules']);
                } finally {
                    await rm(addIgnoreTestDir, { recursive: true, force: true });
                }
            });

            test('should handle removing parent ignore file and invalidate children', async () => {
                const removeIgnoreTestDir = join(tmpdir(), `aglint-remove-ignore-test-${Date.now()}`);
                await mkdir(join(removeIgnoreTestDir, 'child'), { recursive: true });

                try {
                    // Create parent ignore file
                    await writeFile(join(removeIgnoreTestDir, '.aglintignore'), '*.log');

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: removeIgnoreTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file in child directory
                    await writeFile(join(removeIgnoreTestDir, 'child', 'test.txt'), 'content');
                    await tree.addFile(join(removeIgnoreTestDir, 'child', 'test.txt'));
                    const chain1 = await tree.getIgnoreChain(join(removeIgnoreTestDir, 'child'));
                    expect(chain1.length).toBe(1);
                    expect(chain1[0]?.patterns).toEqual(['*.log']);

                    // Remove parent ignore file
                    await rm(join(removeIgnoreTestDir, '.aglintignore'));

                    // Notify of the removal
                    await tree.changed(join(removeIgnoreTestDir, '.aglintignore'));

                    // Child should no longer see parent's ignore patterns
                    const chain2 = await tree.getIgnoreChain(join(removeIgnoreTestDir, 'child'));
                    expect(chain2.length).toBe(0);
                } finally {
                    await rm(removeIgnoreTestDir, { recursive: true, force: true });
                }
            });

            test('should handle package.json with aglint property when added', async () => {
                const pkgTestDir = join(tmpdir(), `aglint-pkg-added-test-${Date.now()}`);
                await mkdir(pkgTestDir, { recursive: true });

                try {
                    const tree = new LinterTree(fs, pathAdapter, {
                        root: pkgTestDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file initially - no package.json yet
                    await writeFile(join(pkgTestDir, 'test.txt'), 'content');
                    await tree.addFile(join(pkgTestDir, 'test.txt'));
                    const node1 = tree.getNode(pkgTestDir);
                    expect(node1?.configFiles).toEqual([]);

                    // Add package.json WITH aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', aglint: { root: true } }),
                    );

                    // Notify of the addition
                    await tree.changed(join(pkgTestDir, 'package.json'));

                    // Should be recognized as config file
                    const node2 = tree.getNode(pkgTestDir);
                    expect(node2?.configFiles).toContain(join(pkgTestDir, 'package.json'));
                } finally {
                    await rm(pkgTestDir, { recursive: true, force: true });
                }
            });

            test('should not recognize package.json without aglint property when added', async () => {
                const pkgTestDir = join(tmpdir(), `aglint-pkg-no-aglint-test-${Date.now()}`);
                await mkdir(pkgTestDir, { recursive: true });

                try {
                    const tree = new LinterTree(fs, pathAdapter, {
                        root: pkgTestDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file initially
                    await writeFile(join(pkgTestDir, 'test.txt'), 'content');
                    await tree.addFile(join(pkgTestDir, 'test.txt'));

                    // Add package.json WITHOUT aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', version: '1.0.0' }),
                    );

                    // Notify of the addition
                    await tree.changed(join(pkgTestDir, 'package.json'));

                    // Should NOT be recognized as config file
                    const node = tree.getNode(pkgTestDir);
                    expect(node?.configFiles).not.toContain(join(pkgTestDir, 'package.json'));
                } finally {
                    await rm(pkgTestDir, { recursive: true, force: true });
                }
            });

            test('should handle package.json modified to add aglint property', async () => {
                const pkgTestDir = join(tmpdir(), `aglint-pkg-modify-add-test-${Date.now()}`);
                await mkdir(pkgTestDir, { recursive: true });

                try {
                    // Create package.json WITHOUT aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', version: '1.0.0' }),
                    );

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: pkgTestDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file - package.json should not be recognized
                    await writeFile(join(pkgTestDir, 'test.txt'), 'content');
                    await tree.addFile(join(pkgTestDir, 'test.txt'));
                    const node1 = tree.getNode(pkgTestDir);
                    expect(node1?.configFiles).not.toContain(join(pkgTestDir, 'package.json'));

                    // Modify package.json to ADD aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', version: '1.0.0', aglint: { root: true } }),
                    );

                    // Notify of the change
                    await tree.changed(join(pkgTestDir, 'package.json'));

                    // Should NOW be recognized as config file
                    const node2 = tree.getNode(pkgTestDir);
                    expect(node2?.configFiles).toContain(join(pkgTestDir, 'package.json'));
                } finally {
                    await rm(pkgTestDir, { recursive: true, force: true });
                }
            });

            test('should handle package.json modified to remove aglint property', async () => {
                const pkgTestDir = join(tmpdir(), `aglint-pkg-modify-remove-test-${Date.now()}`);
                await mkdir(pkgTestDir, { recursive: true });

                try {
                    // Create package.json WITH aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', aglint: { root: true } }),
                    );

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: pkgTestDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file - package.json should be recognized
                    await writeFile(join(pkgTestDir, 'test.txt'), 'content');
                    await tree.addFile(join(pkgTestDir, 'test.txt'));
                    const node1 = tree.getNode(pkgTestDir);
                    expect(node1?.configFiles).toContain(join(pkgTestDir, 'package.json'));

                    // Modify package.json to REMOVE aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', version: '1.0.0' }),
                    );

                    // Notify of the change
                    await tree.changed(join(pkgTestDir, 'package.json'));

                    // Should NO LONGER be recognized as config file
                    const node2 = tree.getNode(pkgTestDir);
                    expect(node2?.configFiles).not.toContain(join(pkgTestDir, 'package.json'));
                } finally {
                    await rm(pkgTestDir, { recursive: true, force: true });
                }
            });

            test('should handle package.json deletion', async () => {
                const pkgTestDir = join(tmpdir(), `aglint-pkg-delete-test-${Date.now()}`);
                await mkdir(pkgTestDir, { recursive: true });

                try {
                    // Create package.json WITH aglint property
                    await writeFile(
                        join(pkgTestDir, 'package.json'),
                        JSON.stringify({ name: 'test', aglint: { root: true } }),
                    );

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: pkgTestDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Add file - package.json should be recognized
                    await writeFile(join(pkgTestDir, 'test.txt'), 'content');
                    await tree.addFile(join(pkgTestDir, 'test.txt'));
                    const node1 = tree.getNode(pkgTestDir);
                    expect(node1?.configFiles).toContain(join(pkgTestDir, 'package.json'));

                    // Delete package.json
                    await rm(join(pkgTestDir, 'package.json'));

                    // Notify of the deletion
                    await tree.changed(join(pkgTestDir, 'package.json'));

                    // Should be removed from config files
                    const node2 = tree.getNode(pkgTestDir);
                    expect(node2?.configFiles).not.toContain(join(pkgTestDir, 'package.json'));
                } finally {
                    await rm(pkgTestDir, { recursive: true, force: true });
                }
            });

            test('should invalidate multiple nested children when ancestor config changes', async () => {
                const deepTestDir = join(tmpdir(), `aglint-deep-test-${Date.now()}`);
                await mkdir(join(deepTestDir, 'level1', 'level2', 'level3'), { recursive: true });

                try {
                    // Create config at root
                    await writeFile(
                        join(deepTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { v1: 'error' } }),
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
                        root: deepTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add files at different levels and cache their configs
                    await writeFile(join(deepTestDir, 'level1', 'test1.txt'), 'content');
                    await writeFile(join(deepTestDir, 'level1', 'level2', 'test2.txt'), 'content');
                    await writeFile(join(deepTestDir, 'level1', 'level2', 'level3', 'test3.txt'), 'content');

                    await tree.addFile(join(deepTestDir, 'level1', 'test1.txt'));
                    await tree.addFile(join(deepTestDir, 'level1', 'level2', 'test2.txt'));
                    await tree.addFile(join(deepTestDir, 'level1', 'level2', 'level3', 'test3.txt'));

                    const config1 = await tree.getResolvedConfig(join(deepTestDir, 'level1'));
                    const config2 = await tree.getResolvedConfig(join(deepTestDir, 'level1', 'level2'));
                    const config3 = await tree.getResolvedConfig(join(deepTestDir, 'level1', 'level2', 'level3'));

                    expect(config1.rules).toEqual({ v1: 'error' });
                    expect(config2.rules).toEqual({ v1: 'error' });
                    expect(config3.rules).toEqual({ v1: 'error' });

                    // Modify root config
                    await writeFile(
                        join(deepTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { v2: 'warn' } }),
                    );

                    // Notify of change
                    await tree.changed(join(deepTestDir, '.aglintrc.json'));

                    // All nested children should see the update
                    const newConfig1 = await tree.getResolvedConfig(join(deepTestDir, 'level1'));
                    const newConfig2 = await tree.getResolvedConfig(join(deepTestDir, 'level1', 'level2'));
                    const newConfig3 = await tree.getResolvedConfig(join(deepTestDir, 'level1', 'level2', 'level3'));

                    expect(newConfig1.rules).toEqual({ v2: 'warn' });
                    expect(newConfig2.rules).toEqual({ v2: 'warn' });
                    expect(newConfig3.rules).toEqual({ v2: 'warn' });
                } finally {
                    await rm(deepTestDir, { recursive: true, force: true });
                }
            });

            test('should call configResolver.invalidate() when config file changes', async () => {
                const invalidateTestDir = join(tmpdir(), `aglint-invalidate-test-${Date.now()}`);
                await mkdir(invalidateTestDir, { recursive: true });

                try {
                    // Create initial config
                    await writeFile(
                        join(invalidateTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-1': 'error' } }),
                    );

                    const invalidatedPaths: string[] = [];
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
                        invalidate: (configPath: string) => {
                            invalidatedPaths.push(configPath);
                        },
                    };

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: invalidateTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    await tree.addFile(join(invalidateTestDir, 'test.txt'));

                    // Modify the config file
                    await writeFile(
                        join(invalidateTestDir, '.aglintrc.json'),
                        JSON.stringify({ root: true, rules: { 'rule-2': 'warn' } }),
                    );

                    // Notify of change
                    await tree.changed(join(invalidateTestDir, '.aglintrc.json'));

                    // Verify invalidate was called
                    expect(invalidatedPaths.length).toBe(1);
                    expect(invalidatedPaths[0]).toContain('.aglintrc.json');
                } finally {
                    await rm(invalidateTestDir, { recursive: true, force: true });
                }
            });

            test('should NOT clear sibling directory caches when config changes', async () => {
                const siblingTestDir = join(tmpdir(), `aglint-sibling-test-${Date.now()}`);
                await mkdir(join(siblingTestDir, 'sub'), { recursive: true });
                await mkdir(join(siblingTestDir, 'subfolder'), { recursive: true });

                try {
                    // Create configs in both sibling directories
                    await writeFile(
                        join(siblingTestDir, 'sub', '.aglintrc.json'),
                        JSON.stringify({ root: false, rules: { 'sub-rule': 'error' } }),
                    );
                    await writeFile(
                        join(siblingTestDir, 'subfolder', '.aglintrc.json'),
                        JSON.stringify({ root: false, rules: { 'subfolder-rule': 'warn' } }),
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
                        root: siblingTestDir,
                        configFileNames: new Set(['.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    }, resolver);

                    // Add files in both directories and cache their configs
                    await writeFile(join(siblingTestDir, 'sub', 'test.txt'), 'content');
                    await writeFile(join(siblingTestDir, 'subfolder', 'test.txt'), 'content');

                    await tree.addFile(join(siblingTestDir, 'sub', 'test.txt'));
                    await tree.addFile(join(siblingTestDir, 'subfolder', 'test.txt'));

                    const subConfig1 = await tree.getResolvedConfig(join(siblingTestDir, 'sub'));
                    const subfolderConfig1 = await tree.getResolvedConfig(join(siblingTestDir, 'subfolder'));

                    expect(subConfig1.rules).toEqual({ 'sub-rule': 'error' });
                    expect(subfolderConfig1.rules).toEqual({ 'subfolder-rule': 'warn' });

                    // Modify /sub config
                    await writeFile(
                        join(siblingTestDir, 'sub', '.aglintrc.json'),
                        JSON.stringify({ root: false, rules: { 'sub-rule': 'warn' } }),
                    );

                    // Notify of change in /sub
                    await tree.changed(join(siblingTestDir, 'sub', '.aglintrc.json'));

                    // /sub should see the update
                    const subConfig2 = await tree.getResolvedConfig(join(siblingTestDir, 'sub'));
                    expect(subConfig2.rules).toEqual({ 'sub-rule': 'warn' });

                    // /subfolder should still have cached config (NOT cleared by sibling change)
                    const subfolderConfig2 = await tree.getResolvedConfig(join(siblingTestDir, 'subfolder'));
                    expect(subfolderConfig2.rules).toEqual({ 'subfolder-rule': 'warn' });
                } finally {
                    await rm(siblingTestDir, { recursive: true, force: true });
                }
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

        describe('multiple config files validation', () => {
            test('should throw error when multiple config files exist in same directory', async () => {
                const multiConfigDir = join(tmpdir(), `aglint-multi-config-test-${Date.now()}`);
                await mkdir(multiConfigDir, { recursive: true });

                try {
                    // Create two config files
                    await writeFile(join(multiConfigDir, 'aglint.config.json'), JSON.stringify({ root: true }));
                    await writeFile(join(multiConfigDir, '.aglintrc.json'), JSON.stringify({ root: true }));

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: multiConfigDir,
                        configFileNames: new Set(['aglint.config.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Should throw when scanning directory
                    await expect(
                        tree.addFile(join(multiConfigDir, 'test.txt')),
                    ).rejects.toThrow(/Multiple config files found/);
                } finally {
                    await rm(multiConfigDir, { recursive: true, force: true });
                }
            });

            test('should throw error when package.json with aglint property coexists with other config', async () => {
                const multiConfigDir = join(tmpdir(), `aglint-pkg-multi-config-test-${Date.now()}`);
                await mkdir(multiConfigDir, { recursive: true });

                try {
                    // Create package.json with aglint property
                    await writeFile(
                        join(multiConfigDir, 'package.json'),
                        JSON.stringify({
                            name: 'test',
                            aglint: { root: true },
                        }),
                    );
                    // And another config file
                    await writeFile(join(multiConfigDir, '.aglintrc.json'), JSON.stringify({ root: true }));

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: multiConfigDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Should throw when scanning directory
                    await expect(
                        tree.addFile(join(multiConfigDir, 'test.txt')),
                    ).rejects.toThrow(/Multiple config files found/);
                } finally {
                    await rm(multiConfigDir, { recursive: true, force: true });
                }
            });

            test('should not throw error when package.json without aglint property coexists with config', async () => {
                const multiConfigDir = join(tmpdir(), `aglint-pkg-no-aglint-test-${Date.now()}`);
                await mkdir(multiConfigDir, { recursive: true });

                try {
                    // Create package.json WITHOUT aglint property
                    await writeFile(
                        join(multiConfigDir, 'package.json'),
                        JSON.stringify({
                            name: 'test',
                            version: '1.0.0',
                        }),
                    );
                    // And another config file
                    await writeFile(join(multiConfigDir, '.aglintrc.json'), JSON.stringify({ root: true }));

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: multiConfigDir,
                        configFileNames: new Set(['package.json', '.aglintrc.json']),
                        ignoreFileName: '.aglintignore',
                    });

                    // Should NOT throw - package.json without aglint property doesn't count
                    await expect(
                        tree.addFile(join(multiConfigDir, 'test.txt')),
                    ).resolves.not.toThrow();

                    const node = tree.getNode(multiConfigDir);
                    expect(node?.configFiles.length).toBe(1);
                    expect(node?.configFiles[0]).toContain('.aglintrc.json');
                } finally {
                    await rm(multiConfigDir, { recursive: true, force: true });
                }
            });

            test('should include specific file names in error message', async () => {
                const multiConfigDir = join(tmpdir(), `aglint-error-msg-test-${Date.now()}`);
                await mkdir(multiConfigDir, { recursive: true });

                try {
                    await writeFile(join(multiConfigDir, 'aglint.config.json'), JSON.stringify({}));
                    await writeFile(join(multiConfigDir, '.aglintrc.yaml'), 'root: true');

                    const tree = new LinterTree(fs, pathAdapter, {
                        root: multiConfigDir,
                        configFileNames: new Set(['aglint.config.json', '.aglintrc.yaml']),
                        ignoreFileName: '.aglintignore',
                    });

                    try {
                        await tree.addFile(join(multiConfigDir, 'test.txt'));
                        expect.fail('Should have thrown');
                    } catch (error) {
                        expect((error as Error).message).toContain('aglint.config.json');
                        expect((error as Error).message).toContain('.aglintrc.yaml');
                        expect((error as Error).message).toContain('Please use only one config file per directory');
                    }
                } finally {
                    await rm(multiConfigDir, { recursive: true, force: true });
                }
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
