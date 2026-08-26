import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { type ConfigResolver } from '../../../src/cli/utils/config-resolver';
import { LinterFileScanner } from '../../../src/cli/utils/file-scanner';
import { type FileStats, type FileSystemAdapter } from '../../../src/cli/utils/fs-adapter';
import { type ConfigChainEntry, type LinterTree } from '../../../src/cli/utils/tree-builder';
import { type LinterConfig } from '../../../src/linter/config';
import { LinterRuleSeverity } from '../../../src/linter/rule';

describe('file-scanner', () => {
    let mockTree: LinterTree;
    let mockConfigResolver: ConfigResolver;
    let mockFs: FileSystemAdapter;
    let scanner: LinterFileScanner;

    beforeEach(() => {
        mockTree = {
            addFile: vi.fn().mockResolvedValue(undefined),
            isIgnored: vi.fn().mockResolvedValue(false),
            getConfigChain: vi.fn().mockResolvedValue([]),
        } as unknown as LinterTree;

        mockConfigResolver = {
            resolveChain: vi.fn().mockResolvedValue({
                platforms: [],
                rules: {},
            } as LinterConfig),
        } as unknown as ConfigResolver;

        mockFs = {
            stat: vi.fn().mockResolvedValue({
                size: 1024,
                mtime: Date.now(),
            } as FileStats),
        } as unknown as FileSystemAdapter;

        scanner = new LinterFileScanner(mockTree, mockConfigResolver, mockFs);
    });

    describe('scan', () => {
        test('should scan single file and yield result', async () => {
            const filePath = '/path/to/file.txt';
            const configChain: ConfigChainEntry[] = [
                {
                    path: '/path/.aglintrc.json',
                    directory: '/path',
                    config: { platforms: [], rules: {} } as LinterConfig,
                    isRoot: false,
                },
            ];
            const config: LinterConfig = {
                platforms: [],
                rules: { 'rule-1': LinterRuleSeverity.Error },
            };

            const stats: Partial<FileStats> = { size: 2048, mtime: 1234567890 };

            vi.mocked(mockTree.getConfigChain).mockResolvedValue(configChain);
            vi.mocked(mockConfigResolver.resolveChain).mockResolvedValue(config);
            vi.mocked(mockFs.stat).mockResolvedValue(stats as FileStats);

            const results: any[] = [];
            for await (const file of scanner.scan([filePath])) {
                results.push(file);
            }

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                path: filePath,
                config,
                configChain,
                size: 2048,
                mtime: 1234567890,
            });
            expect(mockTree.addFile).toHaveBeenCalledWith(filePath);
            expect(mockTree.isIgnored).toHaveBeenCalledWith(filePath);
        });

        test('should scan multiple files', async () => {
            const filePaths = ['/file1.txt', '/file2.txt', '/file3.txt'];

            const results: any[] = [];
            for await (const file of scanner.scan(filePaths)) {
                results.push(file);
            }

            expect(results).toHaveLength(3);
            expect(results[0].path).toBe('/file1.txt');
            expect(results[1].path).toBe('/file2.txt');
            expect(results[2].path).toBe('/file3.txt');
            expect(mockTree.addFile).toHaveBeenCalledTimes(3);
        });

        test('should skip ignored files', async () => {
            const filePaths = ['/file1.txt', '/ignored.txt', '/file3.txt'];

            vi.mocked(mockTree.isIgnored).mockImplementation(async (path) => path === '/ignored.txt');

            const results: any[] = [];
            for await (const file of scanner.scan(filePaths)) {
                results.push(file);
            }

            expect(results).toHaveLength(2);
            expect(results[0].path).toBe('/file1.txt');
            expect(results[1].path).toBe('/file3.txt');
        });

        test('should handle empty file array', async () => {
            const results: any[] = [];
            for await (const file of scanner.scan([])) {
                results.push(file);
            }

            expect(results).toHaveLength(0);
            expect(mockTree.addFile).not.toHaveBeenCalled();
        });

        test('should yield files lazily', async () => {
            const filePaths = ['/file1.txt', '/file2.txt', '/file3.txt'];
            const addFileCalls: string[] = [];

            vi.mocked(mockTree.addFile).mockImplementation(async (path: string) => {
                addFileCalls.push(path);
            });

            const generator = scanner.scan(filePaths);
            expect(addFileCalls).toHaveLength(0);

            await generator.next();
            expect(addFileCalls).toHaveLength(1);

            await generator.next();
            expect(addFileCalls).toHaveLength(2);
        });

        test('should propagate errors from tree.addFile', async () => {
            vi.mocked(mockTree.addFile).mockRejectedValue(new Error('Add file failed'));

            const generator = scanner.scan(['/error.txt']);

            await expect(generator.next()).rejects.toThrow('Add file failed');
        });

        test('should propagate errors from tree.isIgnored', async () => {
            vi.mocked(mockTree.isIgnored).mockRejectedValue(new Error('Check ignore failed'));

            const generator = scanner.scan(['/error.txt']);

            await expect(generator.next()).rejects.toThrow('Check ignore failed');
        });

        test('should propagate errors from fs.stat', async () => {
            vi.mocked(mockFs.stat).mockRejectedValue(new Error('Stat failed'));

            const generator = scanner.scan(['/error.txt']);

            await expect(generator.next()).rejects.toThrow('Stat failed');
        });
    });

    describe('scanAll', () => {
        test('should return all files as array', async () => {
            const filePaths = ['/file1.txt', '/file2.txt', '/file3.txt'];

            const results = await scanner.scanAll(filePaths);

            expect(results).toHaveLength(3);
            expect(Array.isArray(results)).toBe(true);
            expect(results[0]!.path).toBe('/file1.txt');
            expect(results[1]!.path).toBe('/file2.txt');
            expect(results[2]!.path).toBe('/file3.txt');
        });

        test('should return empty array for empty input', async () => {
            const results = await scanner.scanAll([]);

            expect(results).toEqual([]);
        });

        test('should skip ignored files', async () => {
            const filePaths = ['/file1.txt', '/ignored.txt', '/file3.txt'];

            vi.mocked(mockTree.isIgnored).mockImplementation(async (path) => path === '/ignored.txt');

            const results = await scanner.scanAll(filePaths);

            expect(results).toHaveLength(2);
            expect(results.every((r) => r.path !== '/ignored.txt')).toBe(true);
        });

        test('should include all scanned file properties', async () => {
            const configChain: ConfigChainEntry[] = [
                {
                    path: '/.aglintrc.json',
                    directory: '/',
                    config: { platforms: [], rules: {} } as LinterConfig,
                    isRoot: true,
                },
            ];
            const config: LinterConfig = {
                platforms: [],
                rules: { 'rule-1': LinterRuleSeverity.Error },
            };

            vi.mocked(mockTree.getConfigChain).mockResolvedValue(configChain);
            vi.mocked(mockConfigResolver.resolveChain).mockResolvedValue(config);
            vi.mocked(mockFs.stat).mockResolvedValue({ size: 1024, mtime: 5000 } as FileStats);

            const results = await scanner.scanAll(['/file.txt']);

            expect(results[0]).toEqual({
                path: '/file.txt',
                config,
                configChain,
                size: 1024,
                mtime: 5000,
            });
        });

        test('should propagate errors', async () => {
            vi.mocked(mockTree.addFile).mockRejectedValue(new Error('Scan error'));

            await expect(scanner.scanAll(['/error.txt'])).rejects.toThrow('Scan error');
        });
    });

    describe('scanBatches', () => {
        test('should yield files in batches', async () => {
            const filePaths = ['/file1.txt', '/file2.txt', '/file3.txt', '/file4.txt', '/file5.txt'];

            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches(filePaths, 2)) {
                batches.push(batch);
            }

            expect(batches).toHaveLength(3);
            expect(batches[0]).toHaveLength(2);
            expect(batches[1]).toHaveLength(2);
            expect(batches[2]).toHaveLength(1);
        });

        test('should handle exact batch size divisions', async () => {
            const filePaths = ['/file1.txt', '/file2.txt', '/file3.txt', '/file4.txt'];

            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches(filePaths, 2)) {
                batches.push(batch);
            }

            expect(batches).toHaveLength(2);
            expect(batches[0]).toHaveLength(2);
            expect(batches[1]).toHaveLength(2);
        });

        test('should handle batch size of 1', async () => {
            const filePaths = ['/file1.txt', '/file2.txt', '/file3.txt'];

            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches(filePaths, 1)) {
                batches.push(batch);
            }

            expect(batches).toHaveLength(3);
            batches.forEach((batch) => expect(batch).toHaveLength(1));
        });

        test('should handle batch size larger than file count', async () => {
            const filePaths = ['/file1.txt', '/file2.txt'];

            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches(filePaths, 10)) {
                batches.push(batch);
            }

            expect(batches).toHaveLength(1);
            expect(batches[0]).toHaveLength(2);
        });

        test('should handle empty file array', async () => {
            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches([], 2)) {
                batches.push(batch);
            }

            expect(batches).toHaveLength(0);
        });

        test('should skip ignored files in batches', async () => {
            const filePaths = ['/file1.txt', '/ignored.txt', '/file3.txt', '/file4.txt'];

            vi.mocked(mockTree.isIgnored).mockImplementation(async (path) => path === '/ignored.txt');

            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches(filePaths, 2)) {
                batches.push(batch);
            }

            const allFiles = batches.flat();
            expect(allFiles).toHaveLength(3);
            expect(allFiles.every((f) => f.path !== '/ignored.txt')).toBe(true);
        });

        test('should maintain file order within batches', async () => {
            const filePaths = ['/a.txt', '/b.txt', '/c.txt', '/d.txt'];

            const batches: any[][] = [];
            for await (const batch of scanner.scanBatches(filePaths, 2)) {
                batches.push(batch);
            }

            expect(batches[0]?.[0]?.path).toBe('/a.txt');
            expect(batches[0]?.[1]?.path).toBe('/b.txt');
            expect(batches[1]?.[0]?.path).toBe('/c.txt');
            expect(batches[1]?.[1]?.path).toBe('/d.txt');
        });

        test('should propagate errors', async () => {
            vi.mocked(mockTree.addFile).mockImplementation(async (path: string) => {
                if (path === '/error.txt') {
                    throw new Error('Batch error');
                }
            });

            const generator = scanner.scanBatches(['/file1.txt', '/error.txt'], 2);

            await expect(
                (async () => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    for await (const batch of generator) {
                        // Consume generator
                    }
                })(),
            ).rejects.toThrow('Batch error');
        });
    });
});
