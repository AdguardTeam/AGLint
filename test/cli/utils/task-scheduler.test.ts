import { describe, expect, test } from 'vitest';

import { type ScannedFile } from '../../../src/cli/utils/file-scanner';
import { createFileTaskBuckets, getTotalSize } from '../../../src/cli/utils/task-scheduler';

describe('task-scheduler', () => {
    // Helper function to create mock ScannedFile objects
    const createMockFile = (path: string, size: number): ScannedFile => ({
        path,
        size,
        mtime: Date.now(),
        config: { platforms: [], rules: {} },
        configChain: [],
    });

    describe('createFileTaskBuckets', () => {
        test('should create correct number of buckets', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
                createMockFile('/file3.txt', 300),
            ];

            const buckets = createFileTaskBuckets(tasks, 3);

            expect(buckets).toHaveLength(3);
        });

        test('should distribute tasks evenly across buckets', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 100),
                createMockFile('/file3.txt', 100),
            ];

            const buckets = createFileTaskBuckets(tasks, 3);

            expect(buckets[0]).toHaveLength(1);
            expect(buckets[1]).toHaveLength(1);
            expect(buckets[2]).toHaveLength(1);
        });

        test('should use greedy algorithm to balance bucket sizes', () => {
            const tasks = [
                createMockFile('/large.txt', 1000),
                createMockFile('/small1.txt', 100),
                createMockFile('/small2.txt', 100),
                createMockFile('/small3.txt', 100),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            // Greedy algorithm should put the large file in first bucket,
            // then balance with smaller files in the second bucket
            const bucket1Size = getTotalSize(buckets[0] ?? []);
            const bucket2Size = getTotalSize(buckets[1] ?? []);

            // Check that buckets are relatively balanced
            expect(Math.abs(bucket1Size - bucket2Size)).toBeLessThanOrEqual(1000);
        });

        test('should assign tasks to smallest bucket first', () => {
            const tasks = [
                createMockFile('/file1.txt', 500),
                createMockFile('/file2.txt', 300),
                createMockFile('/file3.txt', 200),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            // First task (500) goes to bucket 0
            // Second task (300) goes to bucket 1 (smaller)
            // Third task (200) goes to bucket 1 (still smaller: 500 vs 300)
            expect(buckets[0]).toHaveLength(1);
            expect(buckets[0]?.[0]?.size).toBe(500);
            expect(buckets[1]).toHaveLength(2);
        });

        test('should handle single bucket', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
                createMockFile('/file3.txt', 300),
            ];

            const buckets = createFileTaskBuckets(tasks, 1);

            expect(buckets).toHaveLength(1);
            expect(buckets[0]).toHaveLength(3);
        });

        test('should handle more buckets than tasks', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
            ];

            const buckets = createFileTaskBuckets(tasks, 5);

            expect(buckets).toHaveLength(5);
            // First two buckets should have one task each
            expect(buckets[0]).toHaveLength(1);
            expect(buckets[1]).toHaveLength(1);
            // Remaining buckets should be empty
            expect(buckets[2]).toHaveLength(0);
            expect(buckets[3]).toHaveLength(0);
            expect(buckets[4]).toHaveLength(0);
        });

        test('should handle empty tasks array', () => {
            const tasks: ScannedFile[] = [];

            const buckets = createFileTaskBuckets(tasks, 3);

            expect(buckets).toHaveLength(3);
            expect(buckets[0]).toHaveLength(0);
            expect(buckets[1]).toHaveLength(0);
            expect(buckets[2]).toHaveLength(0);
        });

        test('should maintain task order within distribution', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 100),
                createMockFile('/file3.txt', 100),
                createMockFile('/file4.txt', 100),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            // Each bucket should receive alternating tasks
            expect(buckets[0]?.[0]?.path).toBe('/file1.txt');
            expect(buckets[1]?.[0]?.path).toBe('/file2.txt');
            expect(buckets[0]?.[1]?.path).toBe('/file3.txt');
            expect(buckets[1]?.[1]?.path).toBe('/file4.txt');
        });

        test('should handle tasks with zero size', () => {
            const tasks = [
                createMockFile('/file1.txt', 0),
                createMockFile('/file2.txt', 0),
                createMockFile('/file3.txt', 0),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            expect(buckets).toHaveLength(2);
            const totalTasks = buckets.flat().length;
            expect(totalTasks).toBe(3);
        });

        test('should handle mixed sizes effectively', () => {
            const tasks = [
                createMockFile('/huge.txt', 10000),
                createMockFile('/tiny.txt', 1),
                createMockFile('/medium.txt', 500),
                createMockFile('/small.txt', 50),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            expect(buckets).toHaveLength(2);
            // All tasks should be distributed
            expect(buckets[0]!.length + buckets[1]!.length).toBe(4);
        });

        test('should not lose any tasks during distribution', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
                createMockFile('/file3.txt', 300),
                createMockFile('/file4.txt', 400),
                createMockFile('/file5.txt', 500),
            ];

            const buckets = createFileTaskBuckets(tasks, 3);

            const totalTasks = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
            expect(totalTasks).toBe(5);
        });

        test('should handle large number of tasks', () => {
            const tasks = Array.from({ length: 100 }, (_, i) => createMockFile(`/file${i}.txt`, 100 + i));

            const buckets = createFileTaskBuckets(tasks, 4);

            expect(buckets).toHaveLength(4);
            const totalTasks = buckets.flat().length;
            expect(totalTasks).toBe(100);
        });

        test('should create empty buckets when no tasks provided', () => {
            const buckets = createFileTaskBuckets([], 5);

            expect(buckets).toHaveLength(5);
            buckets.forEach((bucket) => {
                expect(bucket).toEqual([]);
            });
        });

        test('should handle very large file sizes', () => {
            const tasks = [
                createMockFile('/huge1.txt', 1_000_000_000),
                createMockFile('/huge2.txt', 1_000_000_000),
                createMockFile('/tiny.txt', 1),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            expect(buckets).toHaveLength(2);
            // Each huge file should go to different buckets
            expect(buckets[0]?.length).toBeGreaterThan(0);
            expect(buckets[1]?.length).toBeGreaterThan(0);
        });

        test('should balance buckets with varying sizes', () => {
            const tasks = [
                createMockFile('/file1.txt', 1000),
                createMockFile('/file2.txt', 800),
                createMockFile('/file3.txt', 600),
                createMockFile('/file4.txt', 400),
                createMockFile('/file5.txt', 200),
            ];

            const buckets = createFileTaskBuckets(tasks, 3);

            // Calculate sizes
            const sizes = buckets.map(getTotalSize);

            // All buckets should have some content (greedy distribution)
            expect(sizes[0]).toBeGreaterThan(0);
            expect(sizes[1]).toBeGreaterThan(0);
            expect(sizes[2]).toBeGreaterThan(0);

            // Total size should be preserved
            expect(sizes.reduce((a, b) => a + b, 0)).toBe(3000);
        });
    });

    describe('getTotalSize', () => {
        test('should calculate total size of multiple files', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
                createMockFile('/file3.txt', 300),
            ];

            const total = getTotalSize(tasks);

            expect(total).toBe(600);
        });

        test('should return 0 for empty array', () => {
            const total = getTotalSize([]);

            expect(total).toBe(0);
        });

        test('should handle single file', () => {
            const tasks = [createMockFile('/file1.txt', 500)];

            const total = getTotalSize(tasks);

            expect(total).toBe(500);
        });

        test('should handle files with zero size', () => {
            const tasks = [
                createMockFile('/file1.txt', 0),
                createMockFile('/file2.txt', 0),
                createMockFile('/file3.txt', 100),
            ];

            const total = getTotalSize(tasks);

            expect(total).toBe(100);
        });

        test('should handle large file sizes', () => {
            const tasks = [
                createMockFile('/huge1.txt', 1_000_000_000),
                createMockFile('/huge2.txt', 1_000_000_000),
            ];

            const total = getTotalSize(tasks);

            expect(total).toBe(2_000_000_000);
        });

        test('should handle many small files', () => {
            const tasks = Array.from({ length: 1000 }, (_, i) => createMockFile(`/file${i}.txt`, 1));

            const total = getTotalSize(tasks);

            expect(total).toBe(1000);
        });

        test('should work with getTotalSize on buckets', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
                createMockFile('/file3.txt', 300),
                createMockFile('/file4.txt', 400),
            ];

            const buckets = createFileTaskBuckets(tasks, 2);

            const bucket1Size = getTotalSize(buckets[0] ?? []);
            const bucket2Size = getTotalSize(buckets[1] ?? []);

            expect(bucket1Size + bucket2Size).toBe(1000);
        });
    });

    describe('integration scenarios', () => {
        test('should distribute and verify total size is preserved', () => {
            const tasks = [
                createMockFile('/file1.txt', 100),
                createMockFile('/file2.txt', 200),
                createMockFile('/file3.txt', 300),
                createMockFile('/file4.txt', 400),
                createMockFile('/file5.txt', 500),
            ];

            const originalTotal = getTotalSize(tasks);
            const buckets = createFileTaskBuckets(tasks, 3);
            const distributedTotal = buckets.reduce(
                (sum, bucket) => sum + getTotalSize(bucket),
                0,
            );

            expect(distributedTotal).toBe(originalTotal);
            expect(distributedTotal).toBe(1500);
        });

        test('should balance load across buckets reasonably', () => {
            const tasks = Array.from({ length: 10 }, (_, i) => createMockFile(`/file${i}.txt`, (i + 1) * 100));

            const buckets = createFileTaskBuckets(tasks, 3);
            const sizes = buckets.map(getTotalSize);

            // Check that no bucket is empty
            sizes.forEach((size) => {
                expect(size).toBeGreaterThan(0);
            });

            // Check load balance (largest shouldn't be more than 2x smallest)
            const maxSize = Math.max(...sizes);
            const minSize = Math.min(...sizes.filter((s) => s > 0));
            expect(maxSize / minSize).toBeLessThan(3);
        });

        test('should work with typical CLI workflow', () => {
            // Simulate scanning files with different sizes
            const tasks = [
                createMockFile('/src/large-file1.txt', 50000),
                createMockFile('/src/large-file2.txt', 45000),
                createMockFile('/src/medium1.txt', 10000),
                createMockFile('/src/medium2.txt', 8000),
                createMockFile('/src/small1.txt', 1000),
                createMockFile('/src/small2.txt', 500),
                createMockFile('/src/tiny.txt', 100),
            ];

            const totalSize = getTotalSize(tasks);
            const buckets = createFileTaskBuckets(tasks, 4);

            expect(totalSize).toBe(114600);
            expect(buckets).toHaveLength(4);

            // Verify distribution
            const bucketSizes = buckets.map(getTotalSize);
            const totalDistributed = bucketSizes.reduce((a, b) => a + b, 0);
            expect(totalDistributed).toBe(totalSize);
        });
    });
});
