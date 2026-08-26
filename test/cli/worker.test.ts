import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type { CacheFileData } from '../../src/cli/cache';
import { LinterCacheStrategy } from '../../src/cli/cache';
import type { LinterCliConfig } from '../../src/cli/cli-options';
import runLinterWorker from '../../src/cli/worker';
import type { LinterConfig } from '../../src/linter/config';
import type { LinterResult } from '../../src/linter/linter';

// Mock file system
vi.mock('node:fs/promises', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await vi.importActual('node:fs/promises') as typeof import('node:fs/promises');
    return {
        ...actual,
        readFile: vi.fn(),
        writeFile: vi.fn(),
    };
});

// Mock linter (need to preserve linterResultSchema for cache.ts)
vi.mock('../../src/linter/linter', async (importOriginal) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await importOriginal() as typeof import('../../src/linter/linter');
    return {
        ...actual,
        lint: vi.fn(),
    };
});

// Mock fixer
vi.mock('../../src/linter/fixer', async (importOriginal) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await importOriginal() as typeof import('../../src/linter/fixer');
    return {
        ...actual,
        lintWithFixes: vi.fn(),
        applyFixesToResult: vi.fn((params) => params.sourceContent), // Return unchanged by default
    };
});

describe('worker', () => {
    let mockReadFile: ReturnType<typeof vi.fn>;
    let mockWriteFile: ReturnType<typeof vi.fn>;
    let mockLint: ReturnType<typeof vi.fn>;
    let mockLintWithFixes: ReturnType<typeof vi.fn>;

    const createMockLinterResult = (errorCount = 0): LinterResult => ({
        problems: [],
        warningCount: 0,
        errorCount,
        fatalErrorCount: 0,
    });

    const createMockConfig = (): LinterConfig => ({
        platforms: [],
        rules: {},
    });

    const createMockCliConfig = (overrides?: Partial<LinterCliConfig>): LinterCliConfig => ({
        patterns: ['**/*.txt'],
        cache: false,
        debug: false,
        color: false,
        fix: false,
        outputFormat: 'console',
        init: false,
        ...overrides,
    } as LinterCliConfig);

    beforeEach(async () => {
        // Get mocked modules
        const fs = await import('node:fs/promises');
        const linter = await import('../../src/linter/linter');
        const fixer = await import('../../src/linter/fixer');

        mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
        mockWriteFile = fs.writeFile as ReturnType<typeof vi.fn>;
        mockLint = linter.lint as ReturnType<typeof vi.fn>;
        mockLintWithFixes = fixer.lintWithFixes as ReturnType<typeof vi.fn>;

        // Default implementations
        mockReadFile.mockResolvedValue('||example.com^');
        mockWriteFile.mockResolvedValue(undefined);
        mockLint.mockReturnValue(createMockLinterResult());
        mockLintWithFixes.mockReturnValue({ result: createMockLinterResult(), fixedSource: '||example.com^' });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('without cache', () => {
        test('should lint file when cache is disabled', async () => {
            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                    },
                ],
                cliConfig: createMockCliConfig(),
            });

            expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
            expect(mockLint).toHaveBeenCalled();
            expect(result.results).toHaveLength(1);
            expect(result.results[0]?.fromCache).toBe(false);
        });

        test('should process multiple files', async () => {
            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file1.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                    },
                    {
                        filePath: '/test/file2.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 2000,
                        size: 200,
                    },
                ],
                cliConfig: createMockCliConfig(),
            });

            expect(mockReadFile).toHaveBeenCalledTimes(2);
            expect(mockLint).toHaveBeenCalledTimes(2);
            expect(result.results).toHaveLength(2);
        });

        test('should return file hash for content strategy', async () => {
            const fileContent = '||example.com^';
            mockReadFile.mockResolvedValue(fileContent);

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Content,
                }),
            });

            expect(result.results[0]?.fileHash).toBeDefined();
            expect(typeof result.results[0]?.fileHash).toBe('string');
        });
    });

    describe('with cache - metadata strategy', () => {
        test('should use valid cache and skip linting', async () => {
            const cachedResult = createMockLinterResult();
            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: cachedResult,
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Metadata,
                }),
            });

            // Should not read file or lint when cache is valid
            expect(mockReadFile).not.toHaveBeenCalled();
            expect(mockLint).not.toHaveBeenCalled();
            expect(result.results[0]?.fromCache).toBe(true);
            expect(result.results[0]?.linterResult).toBe(cachedResult);
        });

        test('should invalidate cache and re-lint when mtime changes', async () => {
            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: createMockLinterResult(),
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 2000, // Changed mtime
                        size: 100,
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Metadata,
                }),
            });

            expect(mockReadFile).toHaveBeenCalled();
            expect(mockLint).toHaveBeenCalled();
            expect(result.results[0]?.fromCache).toBe(false);
        });

        test('should invalidate cache and re-lint when size changes', async () => {
            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: createMockLinterResult(),
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 200, // Changed size
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Metadata,
                }),
            });

            expect(mockReadFile).toHaveBeenCalled();
            expect(mockLint).toHaveBeenCalled();
            expect(result.results[0]?.fromCache).toBe(false);
        });
    });

    describe('with cache - content strategy', () => {
        test('should use valid cache when content hash matches', async () => {
            const fileContent = '||example.com^';
            mockReadFile.mockResolvedValue(fileContent);

            // Calculate actual hash for the content
            const { getFileHash } = await import('../../src/cli/cache');
            const contentHash = getFileHash(fileContent);

            const cachedResult = createMockLinterResult();
            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: cachedResult,
                contentHash,
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Content,
                }),
            });

            // Should read file to validate hash but not lint
            expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
            expect(mockLint).not.toHaveBeenCalled();
            expect(result.results[0]?.fromCache).toBe(true);
            expect(result.results[0]?.linterResult).toBe(cachedResult);
        });

        test('should invalidate cache and re-lint when content changes', async () => {
            const oldContent = '||example.com^';
            const newContent = '||different.com^';
            mockReadFile.mockResolvedValue(newContent);

            const { getFileHash } = await import('../../src/cli/cache');
            const oldHash = getFileHash(oldContent);

            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: createMockLinterResult(),
                contentHash: oldHash,
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Content,
                }),
            });

            expect(mockReadFile).toHaveBeenCalled();
            expect(mockLint).toHaveBeenCalled();
            expect(result.results[0]?.fromCache).toBe(false);
        });

        test('should allow mtime/size mismatch when content matches', async () => {
            const fileContent = '||example.com^';
            mockReadFile.mockResolvedValue(fileContent);

            const { getFileHash } = await import('../../src/cli/cache');
            const contentHash = getFileHash(fileContent);

            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: createMockLinterResult(),
                contentHash,
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 2000, // Different mtime
                        size: 200, // Different size
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Content,
                }),
            });

            // Should still use cache because content hash matches
            expect(mockLint).not.toHaveBeenCalled();
            expect(result.results[0]?.fromCache).toBe(true);
        });
    });

    describe('fix mode', () => {
        test('should apply fixes when fix mode is enabled', async () => {
            const originalContent = '||example.com^';
            const fixedContent = '||example.com^\n';

            mockReadFile.mockResolvedValue(originalContent);
            mockLintWithFixes.mockReturnValue({
                result: createMockLinterResult(),
                fixedSource: fixedContent,
            });

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                    },
                ],
                cliConfig: createMockCliConfig({ fix: true }),
            });

            expect(mockLintWithFixes).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalledWith('/test/file.txt', fixedContent);
            expect(result.results[0]?.fromCache).toBe(false);
        });

        test('should not write file when fixes produce no changes', async () => {
            const content = '||example.com^';

            mockReadFile.mockResolvedValue(content);
            mockLintWithFixes.mockReturnValue({
                result: createMockLinterResult(),
                fixedSource: content, // No changes
            });

            await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                    },
                ],
                cliConfig: createMockCliConfig({ fix: true }),
            });

            expect(mockWriteFile).not.toHaveBeenCalled();
        });

        test('should apply fixes from cached result in content strategy', async () => {
            const originalContent = '||example.com^';
            const fixedContent = '||example.com^\n';

            mockReadFile.mockResolvedValue(originalContent);

            const { getFileHash } = await import('../../src/cli/cache');
            const { applyFixesToResult } = await import('../../src/linter/fixer');
            const mockApplyFixes = applyFixesToResult as ReturnType<typeof vi.fn>;
            mockApplyFixes.mockReturnValue(fixedContent);

            const contentHash = getFileHash(originalContent);
            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: createMockLinterResult(),
                contentHash,
            };

            await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                        fileCacheData: cachedData,
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Content,
                    fix: true,
                }),
            });

            // Should apply fixes from cache without re-linting
            expect(mockLint).not.toHaveBeenCalled();
            expect(mockApplyFixes).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalledWith('/test/file.txt', fixedContent);
        });
    });

    describe('batch processing', () => {
        test('should process all tasks and return results in order', async () => {
            const tasks = [
                {
                    filePath: '/test/file1.txt',
                    cwd: '/test',
                    linterConfig: createMockConfig(),
                    mtime: 1000,
                    size: 100,
                },
                {
                    filePath: '/test/file2.txt',
                    cwd: '/test',
                    linterConfig: createMockConfig(),
                    mtime: 2000,
                    size: 200,
                },
                {
                    filePath: '/test/file3.txt',
                    cwd: '/test',
                    linterConfig: createMockConfig(),
                    mtime: 3000,
                    size: 300,
                },
            ];

            const result = await runLinterWorker({
                tasks,
                cliConfig: createMockCliConfig(),
            });

            expect(result.results).toHaveLength(3);
            expect(mockReadFile).toHaveBeenCalledTimes(3);
            expect(mockLint).toHaveBeenCalledTimes(3);

            // Verify results correspond to tasks
            expect(result.results[0]).toBeDefined();
            expect(result.results[1]).toBeDefined();
            expect(result.results[2]).toBeDefined();
        });

        test('should handle mix of cached and non-cached files', async () => {
            const { getFileHash } = await import('../../src/cli/cache');
            const fileContent = '||example.com^';
            mockReadFile.mockResolvedValue(fileContent);

            const cachedData: CacheFileData = {
                meta: { mtime: 1000, size: 100 },
                linterConfigHash: 'hash123',
                linterResult: createMockLinterResult(),
                contentHash: getFileHash(fileContent),
            };

            const result = await runLinterWorker({
                tasks: [
                    {
                        filePath: '/test/file1.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 1000,
                        size: 100,
                        fileCacheData: cachedData, // Has cache
                    },
                    {
                        filePath: '/test/file2.txt',
                        cwd: '/test',
                        linterConfig: createMockConfig(),
                        mtime: 2000,
                        size: 200,
                        // No cache
                    },
                ],
                cliConfig: createMockCliConfig({
                    cache: true,
                    cacheStrategy: LinterCacheStrategy.Content,
                }),
            });

            expect(result.results[0]?.fromCache).toBe(true);
            expect(result.results[1]?.fromCache).toBe(false);
            expect(mockLint).toHaveBeenCalledTimes(1); // Only for non-cached file
        });
    });
});
