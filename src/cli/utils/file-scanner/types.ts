import { type LinterConfig } from '../../../linter/config';
import { type ConfigChainEntry } from '../tree-builder';

/**
 * A scanned file with its resolved configuration.
 */
export interface ScannedFile {
    /**
     * Absolute path to the file.
     */
    path: string;

    /**
     * Resolved linter configuration for this file.
     */
    config: LinterConfig;

    /**
     * Config chain from closest to farthest.
     */
    configChain: ConfigChainEntry[];

    /**
     * File size in bytes.
     */
    size: number;

    /**
     * Last modification time in milliseconds.
     */
    mtime: number;
}
