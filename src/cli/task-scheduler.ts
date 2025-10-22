import { type LinterCliScannedFile } from './file-scanner';

/**
 * Distributes tasks into buckets for parallel processing using a greedy algorithm
 */
export function createFileTaskBuckets(tasks: LinterCliScannedFile[], bucketCount: number): LinterCliScannedFile[][] {
    const buckets: LinterCliScannedFile[][] = Array.from({ length: bucketCount }, () => []);
    const bucketSizes = Array(bucketCount).fill(0);

    for (const task of tasks) {
        const idx = bucketSizes.indexOf(Math.min(...bucketSizes));
        buckets[idx]!.push(task);
        bucketSizes[idx] += task.size;
    }

    return buckets;
}

/**
 * Calculates total size of all tasks
 */
export function getTotalSize(tasks: LinterCliScannedFile[]): number {
    return tasks.reduce((sum, task) => sum + task.size, 0);
}
