import { type LinterConfig } from '../../../linter/config';

/**
 * Options for the config resolver.
 */
export interface ConfigResolverOptions {
    /**
     * Absolute path to the presets directory.
     */
    presetsRoot: string;

    /**
     * Base configuration to merge when no configs are found.
     */
    baseConfig?: Partial<LinterConfig>;
}

/**
 * Cache entry for a resolved config file.
 */
export interface ConfigCacheEntry {
    /**
     * Flattened configuration (with extends resolved).
     */
    config: LinterConfig;

    /**
     * Whether this config has root: true.
     */
    isRoot: boolean;

    /**
     * Timestamp when this was cached.
     */
    timestamp: number;
}
