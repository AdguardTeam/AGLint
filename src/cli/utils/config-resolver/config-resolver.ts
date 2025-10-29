import * as v from 'valibot';
import { parse as parseYaml } from 'yaml';

import { type LinterConfig } from '../../../linter/config';
import { deepMerge } from '../../../utils/deepmerge';
import {
    EXT_JSON,
    EXT_YAML,
    EXT_YML,
    type LinterConfigFile,
    linterConfigFileSchema,
    RC_CONFIG_FILE,
} from '../../config-file/config-file';
import { type FileSystemAdapter } from '../fs-adapter';
import { type PathAdapter } from '../path-adapter';
import { type ConfigChainEntry } from '../tree-builder';

import { PresetResolver } from './preset-resolver';
import { type ConfigCacheEntry, type ConfigResolverOptions } from './types';

const AGLINT_PREFIX = 'aglint:';

/**
 * Resolves and flattens linter configurations.
 * Handles extends, presets, and config chains from LinterTree.
 */
export class ConfigResolver {
    /**
     * Cache of resolved configs.
     */
    private cache: Map<string, ConfigCacheEntry> = new Map();

    /**
     * Preset resolver for resolving preset references.
     */
    private presetResolver: PresetResolver;

    /**
     * Creates a new ConfigResolver instance.
     *
     * @param fs The file system adapter to use for file operations.
     * @param pathAdapter The path adapter to use for path operations.
     * @param options The config resolver options.
     */
    constructor(
        private fs: FileSystemAdapter,
        private pathAdapter: PathAdapter,
        private options: ConfigResolverOptions,
    ) {
        this.presetResolver = new PresetResolver(fs, pathAdapter, options.presetsRoot);
    }

    /**
     * Resolves a single config file, flattening extends.
     *
     * @param configPath Absolute path to config file.
     *
     * @returns Flattened linter config.
     */
    public async resolve(configPath: string): Promise<LinterConfig> {
        const absPath = this.pathAdapter.toPosix(this.pathAdapter.resolve(configPath));

        // Check cache
        if (this.cache.has(absPath)) {
            return this.cache.get(absPath)!.config;
        }

        const result = await this.resolveRecursive(absPath, new Set());
        return result.config;
    }

    /**
     * Checks if a config file has root: true.
     *
     * @param configPath Absolute path to config file.
     *
     * @returns True if config has root: true.
     */
    public async isRoot(configPath: string): Promise<boolean> {
        const absPath = this.pathAdapter.toPosix(this.pathAdapter.resolve(configPath));

        // Check cache
        if (this.cache.has(absPath)) {
            return this.cache.get(absPath)!.isRoot;
        }

        // Read and parse to check root flag
        const content = await this.fs.readFile(absPath);
        const parsed = ConfigResolver.parseConfig(content, absPath);

        return parsed.root === true;
    }

    /**
     * Resolves a config chain from LinterTree, merging all configs.
     * Later configs in the chain override earlier ones.
     *
     * @param configChain Config chain from LinterTree.getConfigChain().
     *
     * @returns Merged linter config.
     */
    public async resolveChain(configChain: ConfigChainEntry[]): Promise<LinterConfig> {
        if (configChain.length === 0) {
            return deepMerge({}, this.options.baseConfig || {}) as LinterConfig;
        }

        // Start with base config
        let merged = deepMerge({}, this.options.baseConfig || {}) as LinterConfig;

        // Merge chain from farthest (root) to closest
        for (let i = configChain.length - 1; i >= 0; i -= 1) {
            const entry = configChain[i]!;
            merged = deepMerge(merged, entry.config) as LinterConfig;
        }

        return merged;
    }

    /**
     * Invalidates cache for a config file.
     * Should be called when a config file changes.
     *
     * @param configPath Absolute path to config file.
     */
    public invalidate(configPath: string): void {
        const absPath = this.pathAdapter.toPosix(this.pathAdapter.resolve(configPath));
        this.cache.delete(absPath);
    }

    /**
     * Clears all caches.
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Recursively resolves a config file with extends.
     *
     * @param configPath Absolute path to config file.
     * @param seen Set of seen config paths to detect circular references.
     *
     * @returns Resolved config and metadata.
     */
    private async resolveRecursive(
        configPath: string,
        seen: Set<string>,
    ): Promise<ConfigCacheEntry> {
        const absPath = this.pathAdapter.toPosix(this.pathAdapter.resolve(configPath));

        // Check cache
        if (this.cache.has(absPath)) {
            return this.cache.get(absPath)!;
        }

        // Detect circular references
        if (seen.has(absPath)) {
            const chain = [...seen, absPath].map((p) => this.pathAdapter.basename(p)).join(' -> ');
            throw new Error(`Circular "extends" detected: ${chain}`);
        }

        seen.add(absPath);

        // Read and parse config
        const content = await this.fs.readFile(absPath);
        const parsed = ConfigResolver.parseConfig(content, absPath);
        const configDir = this.pathAdapter.dirname(absPath);

        // Resolve extends
        let mergedFromExtends: LinterConfig = {} as LinterConfig;

        if (parsed.extends?.length) {
            for (const ref of parsed.extends) {
                let refPath: string;

                if (ref.startsWith(AGLINT_PREFIX)) {
                    // Preset reference
                    const presetName = ref.slice(AGLINT_PREFIX.length);
                    // eslint-disable-next-line no-await-in-loop
                    refPath = await this.presetResolver.resolve(presetName);
                } else {
                    // Relative path reference
                    const hasExtension = ref.endsWith(EXT_JSON) || ref.endsWith(EXT_YAML) || ref.endsWith(EXT_YML);
                    refPath = hasExtension
                        ? this.pathAdapter.toPosix(this.pathAdapter.join(configDir, ref))
                        : this.pathAdapter.toPosix(this.pathAdapter.join(configDir, `${ref}.json`));
                }

                // eslint-disable-next-line no-await-in-loop
                const extendedEntry = await this.resolveRecursive(refPath, new Set(seen));
                mergedFromExtends = deepMerge(
                    mergedFromExtends,
                    extendedEntry.config,
                ) as LinterConfig;
            }
        }

        // Merge local config (drop extends and root)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { extends: _extends, root: _root, ...localRest } = parsed;
        const flattened = deepMerge(mergedFromExtends, localRest) as LinterConfig;

        // Cache result
        const entry: ConfigCacheEntry = {
            config: flattened,
            isRoot: parsed.root === true,
            timestamp: Date.now(),
        };

        this.cache.set(absPath, entry);
        seen.delete(absPath);

        return entry;
    }

    /**
     * Parses config file content.
     *
     * @param content The content of the config file.
     * @param filePath The path to the config file.
     *
     * @returns The parsed config file.
     */
    private static parseConfig(content: string, filePath: string): LinterConfigFile {
        try {
            if (filePath.endsWith(EXT_JSON) || filePath.endsWith(RC_CONFIG_FILE)) {
                const parsed = JSON.parse(content);
                return v.parse(linterConfigFileSchema, parsed);
            }

            if (filePath.endsWith(EXT_YAML) || filePath.endsWith(EXT_YML)) {
                // Note: YAML parsing would go here
                // For now, assume JSON
                return parseYaml(content);
            }

            throw new Error(`Unsupported config file format: ${filePath}`);
        } catch (error) {
            throw new Error(`Failed to parse config file ${filePath}: ${error}`);
        }
    }
}
