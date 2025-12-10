import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { LinterCacheStrategy, LintResultCache } from '../../src/cli/cache';
import { type LinterCliConfig } from '../../src/cli/cli-options';
import { runParallel, runSequential } from '../../src/cli/executor';
import { type LinterCliReporter } from '../../src/cli/reporters/reporter';
import { type ScannedFile } from '../../src/cli/utils/file-scanner';
import { type LinterResult } from '../../src/linter/linter';

// Mock the worker module
vi.mock('../../src/cli/worker', () => ({
    default: vi.fn(),
}));

// Mock Piscina to avoid loading actual worker.js
vi.mock('piscina', () => ({
    default: class MockPiscina {
        /**
         * Mock run method that forwards to mocked worker.
         *
         * @param tasks Worker tasks.
         *
         * @returns Worker results.
         */
        // eslint-disable-next-line class-methods-use-this
        public async run(tasks: unknown) {
            // Forward to the mocked worker
            const workerModule = await import('../../src/cli/worker');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return workerModule.default(tasks as any);
        }
    },
}));

describe('executor', () => {
    let cacheDir: string;
    let mockWorker: ReturnType<typeof vi.fn>;
    let mockReporter: LinterCliReporter;
    let testConfig: LinterCliConfig;
    const cwd = '/test/cwd';

    beforeEach(async () => {
        cacheDir = join(tmpdir(), `aglint-executor-test-${Date.now()}`);

        // Import the mocked worker
        const workerModule = await import('../../src/cli/worker');
        mockWorker = workerModule.default as ReturnType<typeof vi.fn>;

        // Reset mock
        mockWorker.mockReset();

        // Setup mock reporter
        mockReporter = {
            onCliStart: vi.fn(),
            onCliEnd: vi.fn(),
            onFileStart: vi.fn(),
            onFileEnd: vi.fn(),
        };

        // Setup test config
        testConfig = {
            patterns: ['**/*.txt'],
            cache: false,
            debug: false,
            color: false,
            fix: false,
            outputFormat: 'stylish',
            init: false,
        } as unknown as LinterCliConfig;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createMockFile = (path: string, mtime = 1000, size = 100): ScannedFile => ({
        path,
        config: { platforms: [], rules: {} },
        configChain: [],
        mtime,
        size,
    });

    const createMockResult = (hasError = false): LinterResult => ({
        problems: [],
        warningCount: 0,
        errorCount: hasError ? 1 : 0,
        fatalErrorCount: 0,
    });

    describe('runSequential', () => {
        test('should process files sequentially without cache', async () => {
            const files = [
                createMockFile('/test/file1.txt'),
                createMockFile('/test/file2.txt'),
            ];

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: false },
                ],
            });

            const result = await runSequential(files, testConfig, mockReporter, cwd);

            // Worker should be called for each file
            expect(mockWorker).toHaveBeenCalledTimes(2);

            // Verify worker was called with correct params (no cache data)
            expect(mockWorker).toHaveBeenCalledWith(
                expect.objectContaining({
                    tasks: expect.arrayContaining([
                        expect.objectContaining({
                            filePath: '/test/file1.txt',
                            cwd,
                            fileCacheData: undefined,
                        }),
                    ]),
                    cliConfig: testConfig,
                }),
            );

            // Reporter callbacks should be invoked
            expect(mockReporter.onCliStart).toHaveBeenCalledWith(testConfig);
            expect(mockReporter.onFileStart).toHaveBeenCalledTimes(2);
            expect(mockReporter.onFileEnd).toHaveBeenCalledTimes(2);
            expect(mockReporter.onCliEnd).toHaveBeenCalled();

            // No errors
            expect(result).toBe(false);
        });

        test('should process files sequentially with cache enabled', async () => {
            const files = [
                createMockFile('/test/file1.txt'),
                createMockFile('/test/file2.txt'),
            ];

            const cache = await LintResultCache.create(cacheDir, '.aglintcache');
            testConfig.cache = true;
            testConfig.cacheStrategy = LinterCacheStrategy.Metadata;

            // First file: cache miss
            // Second file: cache hit
            mockWorker
                .mockResolvedValueOnce({
                    results: [
                        {
                            linterResult: createMockResult(),
                            fromCache: false,
                            fileHash: undefined,
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    results: [
                        {
                            linterResult: createMockResult(),
                            fromCache: true,
                            fileHash: undefined,
                        },
                    ],
                });

            const result = await runSequential(files, testConfig, mockReporter, cwd, cache);

            // Worker should be called for each file
            expect(mockWorker).toHaveBeenCalledTimes(2);

            // Reporter should show cache status
            expect(mockReporter.onFileEnd).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                false, // First file: not from cache
            );
            expect(mockReporter.onFileEnd).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                true, // Second file: from cache
            );

            expect(result).toBe(false);
        });

        test('should return true when files have errors', async () => {
            const files = [createMockFile('/test/file1.txt')];

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(true), fromCache: false },
                ],
            });

            const result = await runSequential(files, testConfig, mockReporter, cwd);

            expect(result).toBe(true);
        });

        test('should handle empty file list', async () => {
            const files: ScannedFile[] = [];

            const result = await runSequential(files, testConfig, mockReporter, cwd);

            expect(mockWorker).not.toHaveBeenCalled();
            expect(mockReporter.onCliStart).toHaveBeenCalled();
            expect(mockReporter.onCliEnd).toHaveBeenCalled();
            expect(result).toBe(false);
        });

        test('should update cache after linting with cache enabled', async () => {
            const files = [createMockFile('/test/file1.txt', 2000, 200)];
            const cache = await LintResultCache.create(cacheDir, '.aglintcache');
            testConfig.cache = true;
            testConfig.cacheStrategy = LinterCacheStrategy.Metadata;

            const mockLinterResult = createMockResult();
            mockWorker.mockResolvedValue({
                results: [
                    {
                        linterResult: mockLinterResult,
                        fromCache: false,
                        fileHash: 'hash123',
                    },
                ],
            });

            await runSequential(files, testConfig, mockReporter, cwd, cache);

            // Verify cache was updated
            const cachedData = cache.getCacheData('/test/file1.txt', files[0]!.config);
            expect(cachedData).toBeDefined();
            expect(cachedData?.linterResult).toEqual(mockLinterResult);
            expect(cachedData?.contentHash).toBe('hash123');
        });
    });

    describe('runParallel', () => {
        // Note: Parallel tests with Piscina spawn actual worker threads,
        // so mocking is limited. These tests verify the executor logic
        // but may need real file fixtures for full integration testing.

        test.skip('should process file buckets in parallel without cache', async () => {
            const buckets = [
                [createMockFile('/test/file1.txt')],
                [createMockFile('/test/file2.txt')],
            ];

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: false },
                ],
            });

            const result = await runParallel(buckets, testConfig, mockReporter, cwd, 2);

            // Worker should be called for each bucket
            expect(mockWorker).toHaveBeenCalledTimes(2);

            // Verify no cache data passed
            expect(mockWorker).toHaveBeenCalledWith(
                expect.objectContaining({
                    tasks: expect.arrayContaining([
                        expect.objectContaining({
                            fileCacheData: undefined,
                        }),
                    ]),
                }),
            );

            expect(result).toBe(false);
        });

        test.skip('should process file buckets in parallel with cache enabled', async () => {
            const buckets = [
                [createMockFile('/test/file1.txt')],
                [createMockFile('/test/file2.txt')],
            ];

            const cache = await LintResultCache.create(cacheDir, '.aglintcache');
            testConfig.cache = true;
            testConfig.cacheStrategy = LinterCacheStrategy.Content;

            mockWorker.mockResolvedValue({
                results: [
                    {
                        linterResult: createMockResult(),
                        fromCache: false,
                        fileHash: 'hash456',
                    },
                ],
            });

            const result = await runParallel(buckets, testConfig, mockReporter, cwd, 2, cache);

            // Worker should be called for each bucket
            expect(mockWorker).toHaveBeenCalledTimes(2);

            // Verify cache data was passed
            expect(mockWorker).toHaveBeenCalledWith(
                expect.objectContaining({
                    tasks: expect.arrayContaining([
                        expect.objectContaining({
                            filePath: expect.any(String),
                            fileCacheData: expect.anything(),
                        }),
                    ]),
                }),
            );

            expect(result).toBe(false);
        });

        test('should handle multiple files per bucket', async () => {
            const buckets = [
                [
                    createMockFile('/test/file1.txt'),
                    createMockFile('/test/file2.txt'),
                    createMockFile('/test/file3.txt'),
                ],
            ];

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: false },
                    { linterResult: createMockResult(), fromCache: false },
                    { linterResult: createMockResult(), fromCache: false },
                ],
            });

            const result = await runParallel(buckets, testConfig, mockReporter, cwd, 1);

            // Worker called once with 3 tasks
            expect(mockWorker).toHaveBeenCalledTimes(1);
            expect(mockWorker).toHaveBeenCalledWith(
                expect.objectContaining({
                    tasks: expect.arrayContaining([
                        expect.objectContaining({ filePath: '/test/file1.txt' }),
                        expect.objectContaining({ filePath: '/test/file2.txt' }),
                        expect.objectContaining({ filePath: '/test/file3.txt' }),
                    ]),
                }),
            );

            // Reporter called for each file
            expect(mockReporter.onFileStart).toHaveBeenCalledTimes(3);
            expect(mockReporter.onFileEnd).toHaveBeenCalledTimes(3);

            expect(result).toBe(false);
        });

        test('should handle empty buckets', async () => {
            const buckets = [
                [],
                [createMockFile('/test/file1.txt')],
                [],
            ];

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: false },
                ],
            });

            const result = await runParallel(buckets, testConfig, mockReporter, cwd, 3);

            // Worker should only be called for non-empty bucket
            expect(mockWorker).toHaveBeenCalledTimes(1);
            expect(result).toBe(false);
        });

        test.skip('should return true when any file has errors', async () => {
            const buckets = [
                [createMockFile('/test/file1.txt')],
                [createMockFile('/test/file2.txt')],
            ];

            mockWorker
                .mockResolvedValueOnce({
                    results: [
                        { linterResult: createMockResult(false), fromCache: false },
                    ],
                })
                .mockResolvedValueOnce({
                    results: [
                        { linterResult: createMockResult(true), fromCache: false },
                    ],
                });

            const result = await runParallel(buckets, testConfig, mockReporter, cwd, 2);

            expect(result).toBe(true);
        });

        test('should track cache hits and misses', async () => {
            const buckets = [
                [
                    createMockFile('/test/file1.txt'),
                    createMockFile('/test/file2.txt'),
                ],
            ];

            const cache = await LintResultCache.create(cacheDir, '.aglintcache');
            testConfig.cache = true;
            testConfig.cacheStrategy = LinterCacheStrategy.Metadata;

            // One hit, one miss
            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: true, fileHash: undefined },
                    { linterResult: createMockResult(), fromCache: false, fileHash: undefined },
                ],
            });

            await runParallel(buckets, testConfig, mockReporter, cwd, 1, cache);

            // Verify reporter received correct cache status
            const fileEndCalls = (mockReporter.onFileEnd as ReturnType<typeof vi.fn>).mock.calls;
            expect(fileEndCalls[0]![2]).toBe(true); // First file: from cache
            expect(fileEndCalls[1]![2]).toBe(false); // Second file: not from cache
        });
    });

    describe('cache integration', () => {
        test('should not use cache when cache is disabled', async () => {
            const files = [createMockFile('/test/file1.txt')];
            const cache = await LintResultCache.create(cacheDir, '.aglintcache');

            // Pre-populate cache
            cache.setCachedResult(
                '/test/file1.txt',
                1000,
                100,
                files[0]!.config,
                createMockResult(),
            );

            testConfig.cache = false; // Cache disabled

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: false },
                ],
            });

            await runSequential(files, testConfig, mockReporter, cwd, cache);

            // Worker should not receive cache data
            expect(mockWorker).toHaveBeenCalledWith(
                expect.objectContaining({
                    tasks: expect.arrayContaining([
                        expect.objectContaining({
                            fileCacheData: undefined,
                        }),
                    ]),
                }),
            );
        });

        test('should not use cache when cache object is not provided', async () => {
            const files = [createMockFile('/test/file1.txt')];
            testConfig.cache = true;
            testConfig.cacheStrategy = LinterCacheStrategy.Metadata;

            mockWorker.mockResolvedValue({
                results: [
                    { linterResult: createMockResult(), fromCache: false },
                ],
            });

            // Pass undefined cache
            await runSequential(files, testConfig, mockReporter, cwd, undefined);

            // Worker should not receive cache data
            expect(mockWorker).toHaveBeenCalledWith(
                expect.objectContaining({
                    tasks: expect.arrayContaining([
                        expect.objectContaining({
                            fileCacheData: undefined,
                        }),
                    ]),
                }),
            );
        });
    });
});
