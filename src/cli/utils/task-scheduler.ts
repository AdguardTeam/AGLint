import { type ScannedFile } from './file-scanner';

/**
 * Distributes file tasks into buckets for parallel processing.
 *
 * Uses a greedy algorithm to balance file sizes across buckets,
 * assigning each file to the bucket with the smallest total size.
 *
 * @param tasks Array of files to distribute.
 * @param bucketCount Number of buckets (typically equals thread count).
 *
 * @returns Array of file buckets for parallel processing.
 */
export function createFileTaskBuckets(tasks: ScannedFile[], bucketCount: number): ScannedFile[][] {
    const buckets: ScannedFile[][] = Array.from({ length: bucketCount }, () => []);
    const bucketSizes = Array(bucketCount).fill(0);

    for (const task of tasks) {
        const idx = bucketSizes.indexOf(Math.min(...bucketSizes));
        buckets[idx]!.push(task);
        bucketSizes[idx] += task.size;
    }

    return buckets;
}

/**
 * Calculates the total size of all files in bytes.
 *
 * @param tasks Array of files.
 *
 * @returns Total size in bytes.
 */
export function getTotalSize(tasks: ScannedFile[]): number {
    return tasks.reduce((sum, task) => sum + task.size, 0);
}
