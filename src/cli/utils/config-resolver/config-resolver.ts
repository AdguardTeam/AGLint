import objectInspect from 'object-inspect';
import * as v from 'valibot';
import { parse as parseYaml } from 'yaml';

import { type LinterConfig } from '../../../linter/config';
import { normalizeSeverity } from '../../../linter/rule';
import { type ModuleDebug } from '../../../utils/debug';
import { deepMerge } from '../../../utils/deep-merge';
import {
    EXT_JSON,
    EXT_YAML,
    EXT_YML,
    type LinterConfigFileParsed,
    linterConfigFileSchema,
    PACKAGE_JSON,
    RC_CONFIG_FILE,
} from '../../config-file/config-file';
import { type FileSystemAdapter } from '../fs-adapter';
import { type PathAdapter } from '../path-adapter';
import { type ConfigChainEntry } from '../tree-builder';

import { InvalidConfigError } from './error';
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
     * Set of config paths that have already been logged in debug mode.
     * Used to avoid printing the same config chain multiple times.
     */
    private loggedConfigs: Set<string> = new Set();

    /**
     * Preset resolver for resolving preset references.
     */
    private presetResolver: PresetResolver;

    /**
     * Module debugger for logging.
     */
    private debug?: ModuleDebug;

    /**
     * Creates a new ConfigResolver instance.
     *
     * @param fs The file system adapter to use for file operations.
     * @param pathAdapter The path adapter to use for path operations.
     * @param options The config resolver options.
     * @param debug Optional debug instance for logging.
     */
    constructor(
        private fs: FileSystemAdapter,
        private pathAdapter: PathAdapter,
        private options: ConfigResolverOptions,
        debug?: ModuleDebug,
    ) {
        this.presetResolver = new PresetResolver(fs, pathAdapter, options.presetsRoot);
        this.debug = debug;
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
            if (this.debug) {
                this.debug.log(`Cached: ${absPath}`);
            }
            return this.cache.get(absPath)!.config;
        }

        if (this.debug) {
            this.debug.log(`Resolving: ${absPath}`);
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
        const parsed = this.parseConfig(content, absPath);

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

        const targetPath = configChain[0]!.path;
        const isFirstTimeLogging = !this.loggedConfigs.has(targetPath);

        // Log config chain hierarchy (only first time)
        if (this.debug && isFirstTimeLogging) {
            const chainPaths = configChain.map((entry) => entry.path).join(' <- ');
            this.debug.log(`Config chain for ${targetPath} is: ${chainPaths}`);
            this.loggedConfigs.add(targetPath);
        }

        // Start with base config
        let merged = deepMerge({}, this.options.baseConfig || {}) as LinterConfig;

        // Merge chain from farthest (root) to closest
        for (let i = configChain.length - 1; i >= 0; i -= 1) {
            const entry = configChain[i]!;
            merged = deepMerge(merged, entry.config) as LinterConfig;

            // Log result (only first time)
            if (this.debug && isFirstTimeLogging) {
                this.debug.log(`Resolved config for ${entry.path}: ${ConfigResolver.formatConfigJson(merged)}`);
            }
        }

        return ConfigResolver.normalizeConfig(merged);
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
        this.loggedConfigs.clear();
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
        const parsed = this.parseConfig(content, absPath);
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
                    if (this.debug) {
                        this.debug.log(`Config ${absPath} extends preset "${presetName}" -> ${refPath}`);
                    }
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

        // Normalize severity values before caching
        const normalized = ConfigResolver.normalizeConfig(flattened);

        // Cache result
        const entry: ConfigCacheEntry = {
            config: normalized,
            isRoot: parsed.root === true,
            timestamp: Date.now(),
        };

        this.cache.set(absPath, entry);
        seen.delete(absPath);

        return entry;
    }

    /**
     * Normalizes rule severity values from strings to enum values.
     *
     * @param config The config to normalize.
     *
     * @returns The normalized config.
     */
    private static normalizeConfig(config: LinterConfig): LinterConfig {
        if (!config.rules) {
            return config;
        }

        const normalizedRules: typeof config.rules = {};

        for (const [ruleName, ruleConfig] of Object.entries(config.rules)) {
            if (Array.isArray(ruleConfig)) {
                // Tuple format: [severity, ...options]
                normalizedRules[ruleName] = [
                    normalizeSeverity(ruleConfig[0]),
                    ...ruleConfig.slice(1),
                ] as any;
            } else {
                // Single severity
                normalizedRules[ruleName] = normalizeSeverity(ruleConfig);
            }
        }

        return {
            ...config,
            rules: normalizedRules,
        };
    }

    /**
     * Parses config file content.
     *
     * @param content The content of the config file.
     * @param filePath The path to the config file.
     *
     * @returns The parsed config file.
     */
    private parseConfig(content: string, filePath: string): LinterConfigFileParsed {
        try {
            const basename = this.pathAdapter.basename(filePath);

            // Check if this is a package.json file
            if (basename === PACKAGE_JSON) {
                let parsed: any;
                try {
                    parsed = JSON.parse(content);
                } catch (jsonError) {
                    throw new InvalidConfigError(
                        `Invalid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
                        filePath,
                    );
                }

                // For package.json files, extract the "aglint" property
                if (!parsed.aglint) {
                    throw new InvalidConfigError(
                        'No "aglint" property found in package.json',
                        filePath,
                    );
                }

                try {
                    return v.parse(linterConfigFileSchema, parsed.aglint);
                } catch (valibotError) {
                    if (v.isValiError(valibotError)) {
                        const propertyPath = ConfigResolver.formatValibotPath(valibotError);
                        throw new InvalidConfigError(
                            valibotError.message,
                            filePath,
                            propertyPath ? `aglint.${propertyPath}` : 'aglint',
                        );
                    }
                    throw valibotError;
                }
            }

            const ext = this.pathAdapter.extname(filePath);

            if (ext === EXT_JSON || basename === RC_CONFIG_FILE) {
                let parsed: any;
                try {
                    parsed = JSON.parse(content);
                } catch (jsonError) {
                    throw new InvalidConfigError(
                        `Invalid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
                        filePath,
                    );
                }

                try {
                    return v.parse(linterConfigFileSchema, parsed);
                } catch (valibotError) {
                    if (v.isValiError(valibotError)) {
                        const propertyPath = ConfigResolver.formatValibotPath(valibotError);
                        throw new InvalidConfigError(
                            valibotError.message,
                            filePath,
                            propertyPath,
                        );
                    }
                    throw valibotError;
                }
            }

            if (ext === EXT_YAML || ext === EXT_YML) {
                let parsed: any;
                try {
                    parsed = parseYaml(content);
                } catch (yamlError) {
                    throw new InvalidConfigError(
                        `Invalid YAML: ${yamlError instanceof Error ? yamlError.message : String(yamlError)}`,
                        filePath,
                    );
                }

                try {
                    return v.parse(linterConfigFileSchema, parsed);
                } catch (valibotError) {
                    if (v.isValiError(valibotError)) {
                        const propertyPath = ConfigResolver.formatValibotPath(valibotError);
                        throw new InvalidConfigError(
                            valibotError.message,
                            filePath,
                            propertyPath,
                        );
                    }
                    throw valibotError;
                }
            }

            throw new InvalidConfigError(
                'Unsupported config file format',
                filePath,
            );
        } catch (error) {
            if (error instanceof InvalidConfigError) {
                throw error;
            }
            throw new InvalidConfigError(
                `Failed to parse config file: ${error instanceof Error ? error.message : String(error)}`,
                filePath,
            );
        }
    }

    /**
     * Formats a config as colorized JSON for debug logging.
     *
     * @param config The config to format.
     *
     * @returns Colorized JSON string (inline, not pretty-printed).
     */
    private static formatConfigJson(config: LinterConfig): string {
        // Stringify without formatting (inline), then colorize
        return objectInspect(config, { depth: Infinity });
    }

    /**
     * Formats a valibot error path into a dot-separated property path.
     *
     * @param error The valibot error.
     *
     * @returns Dot-separated property path or empty string if no path.
     */
    private static formatValibotPath(error: v.ValiError<any>): string {
        if (!error.issues || error.issues.length === 0) {
            return '';
        }

        // Get the first issue's path
        const issue = error.issues[0];
        if (!issue || !issue.path || issue.path.length === 0) {
            return '';
        }

        // Format path items into a dot-separated string
        return issue.path
            .map((item: any) => {
                if (typeof item.key === 'string' || typeof item.key === 'number') {
                    return String(item.key);
                }
                return '';
            })
            .filter(Boolean)
            .join('.');
    }
}
