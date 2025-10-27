/* eslint-disable class-methods-use-this */
import path from 'node:path';

import { toPosix } from '../to-posix';

import { type ParsedPath, type PathAdapter } from './types';

/**
 * Node.js path adapter implementation.
 * Uses Node's built-in path module with POSIX normalization.
 */
export class NodePathAdapter implements PathAdapter {
    /**
     * Separator character.
     */
    public readonly sep = path.posix.sep;

    /**
     * Separator character.
     */
    public readonly delimiter = path.posix.delimiter;

    /** @inheritdoc */
    public resolve(...pathSegments: string[]): string {
        return this.toPosix(path.resolve(...pathSegments));
    }

    /** @inheritdoc */
    public join(...pathSegments: string[]): string {
        return this.toPosix(path.join(...pathSegments));
    }

    /** @inheritdoc */
    public dirname(p: string): string {
        return this.toPosix(path.dirname(p));
    }

    /** @inheritdoc */
    public basename(p: string, ext?: string): string {
        return path.basename(p, ext);
    }

    /** @inheritdoc */
    public extname(p: string): string {
        return path.extname(p);
    }

    /** @inheritdoc */
    public parse(p: string): ParsedPath {
        const parsed = path.parse(p);
        return {
            root: this.toPosix(parsed.root),
            dir: this.toPosix(parsed.dir),
            base: parsed.base,
            ext: parsed.ext,
            name: parsed.name,
        };
    }

    /** @inheritdoc */
    public relative(from: string, to: string): string {
        return this.toPosix(path.relative(from, to));
    }

    /** @inheritdoc */
    public isAbsolute(p: string): boolean {
        return path.isAbsolute(p);
    }

    /** @inheritdoc */
    public normalize(p: string): string {
        return this.toPosix(path.normalize(p));
    }

    /** @inheritdoc */
    public toPosix(p: string): string {
        return toPosix(p);
    }
}
