/* eslint-disable no-await-in-loop */
import { type ConfigResolver } from '../config-resolver';
import { type FileSystemAdapter } from '../fs-adapter';
import { type LinterTree } from '../tree-builder';

import { type ScannedFile } from './types';

/**
 * High-level file scanner that combines tree, config resolver, and ignore logic.
 * Provides an async iterator for efficient memory usage.
 */
export class LinterFileScanner {
    /**
     * Creates a new LinterFileScanner instance.
     *
     * @param tree The linter tree to use for file scanning.
     * @param configResolver The config resolver to use for resolving configs.
     * @param fs The file system adapter to use for file operations.
     */
    constructor(
        private tree: LinterTree,
        private configResolver: ConfigResolver,
        private fs: FileSystemAdapter,
    ) {}

    /**
     * Scans files, filters ignored ones, and yields files with resolved configs.
     * Uses async generator for memory efficiency - processes files lazily.
     *
     * @param filePaths Array of absolute file paths to scan.
     *
     * @yields ScannedFile objects with path, config, and metadata.
     */
    public async* scan(filePaths: string[]): AsyncGenerator<ScannedFile> {
        for (const filePath of filePaths) {
            // Add file to tree (idempotent - safe to call multiple times)
            await this.tree.addFile(filePath);

            // Check if ignored
            const isIgnored = await this.tree.isIgnored(filePath);
            if (isIgnored) {
                continue; // Skip ignored files
            }

            // Get config chain
            const configChain = await this.tree.getConfigChain(filePath);

            // Resolve final config from chain
            const config = await this.configResolver.resolveChain(configChain);

            // Get file stats
            const stats = await this.fs.stat(filePath);

            yield {
                path: filePath,
                config,
                configChain,
                size: stats.size,
                mtime: stats.mtime,
            };
        }
    }

    /**
     * Scans files and returns them as an array (convenience method).
     * Use scan() generator for better memory efficiency with large file sets.
     *
     * @param filePaths Array of absolute file paths to scan.
     *
     * @returns Array of scanned files.
     */
    public async scanAll(filePaths: string[]): Promise<ScannedFile[]> {
        const results: ScannedFile[] = [];
        for await (const file of this.scan(filePaths)) {
            results.push(file);
        }
        return results;
    }

    /**
     * Scans files in batches for parallel processing.
     * Useful when you want to process files in chunks.
     *
     * @param filePaths Array of absolute file paths to scan.
     * @param batchSize Number of files per batch.
     *
     * @yields Batches of scanned files.
     */
    public async* scanBatches(
        filePaths: string[],
        batchSize: number,
    ): AsyncGenerator<ScannedFile[]> {
        let batch: ScannedFile[] = [];

        for await (const file of this.scan(filePaths)) {
            batch.push(file);

            if (batch.length >= batchSize) {
                yield batch;
                batch = [];
            }
        }

        // Yield remaining files
        if (batch.length > 0) {
            yield batch;
        }
    }
}
