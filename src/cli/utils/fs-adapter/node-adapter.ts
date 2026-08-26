/* eslint-disable class-methods-use-this */
import fs from 'node:fs/promises';

import fastGlob from 'fast-glob';

import { fileExists } from '../file-exists';

import { type FileStats, type FileSystemAdapter, type GlobOptions } from './types';

/**
 * Node.js file system adapter implementation.
 */
export class NodeFileSystemAdapter implements FileSystemAdapter {
    /** @inheritdoc */
    public async readFile(path: string): Promise<string> {
        return fs.readFile(path, 'utf8');
    }

    /** @inheritdoc */
    public async stat(path: string): Promise<FileStats> {
        const stats = await fs.stat(path);
        return {
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            mtime: stats.mtimeMs,
        };
    }

    /** @inheritdoc */
    public async exists(path: string): Promise<boolean> {
        return fileExists(path);
    }

    /** @inheritdoc */
    public async glob(patterns: string[], options: GlobOptions): Promise<string[]> {
        return fastGlob(patterns, {
            cwd: options.cwd,
            dot: options.dot ?? false,
            onlyFiles: options.onlyFiles ?? true,
            followSymbolicLinks: options.followSymlinks ?? false,
            absolute: options.absolute ?? true,
            ignore: options.ignore,
            unique: true,
        });
    }

    // Note: watch() is optional and can be implemented later if needed
}
