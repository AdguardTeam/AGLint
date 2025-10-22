/* eslint-disable no-await-in-loop */
import deepMerge from 'deepmerge';

import { type LinterConfig } from '../../linter/config';
import { type FileSystemAdapter } from '../fs-adapter';
import { type PathAdapter } from '../path-adapter';

import { IgnoreMatcher } from './ignore-matcher';
import {
    type ConfigChainEntry,
    type DirectoryNode,
    type IgnoreChainEntry,
    type LinterTreeOptions,
} from './types';

const mergeOptions: deepMerge.Options = {
    // last-wins for arrays
    arrayMerge: (_dest, source) => source,
};

/**
 * Dynamic directory tree for tracking configs and ignore files.
 * Supports incremental updates and cache invalidation.
 */
export class LinterTree {
    private root: DirectoryNode;

    private nodeCache: Map<string, DirectoryNode> = new Map();

    private scannedDirs: Set<string> = new Set(); // Track which dirs have been scanned

    private ignoreChainCache: Map<string, IgnoreChainEntry[]> = new Map();

    private configChainCache: Map<string, ConfigChainEntry[]> = new Map();

    private resolvedConfigCache: Map<string, LinterConfig> = new Map();

    constructor(
        private fs: FileSystemAdapter,
        private pathAdapter: PathAdapter,
        private options: LinterTreeOptions,
        private configResolver?: {
            resolve: (configPath: string) => Promise<LinterConfig>;
            isRoot: (configPath: string) => Promise<boolean>;
        },
    ) {
        const rootPath = this.pathAdapter.resolve(options.root);
        this.root = {
            path: rootPath,
            children: new Map(),
            files: new Set(),
            configFiles: [],
        };
        this.nodeCache.set(rootPath, this.root);
    }

    /**
     * Adds a file to the tree, creating intermediate directories as needed.
     *
     * @param filePath Absolute path to the file
     */
    public async addFile(filePath: string): Promise<void> {
        const absPath = this.pathAdapter.resolve(filePath);
        const dir = this.pathAdapter.dirname(absPath);

        // Ensure directory node exists
        await this.ensureDirectory(dir);

        // Add file to directory
        const node = this.nodeCache.get(dir);
        if (node) {
            node.files.add(absPath);
        }
    }

    /**
     * Ensures a directory node exists in the tree, creating parent nodes as needed.
     * Scans for .aglintignore and config files in the directory.
     *
     * @param dirPath Absolute path to the directory
     */
    private async ensureDirectory(dirPath: string): Promise<DirectoryNode> {
        const absDirPath = this.pathAdapter.resolve(dirPath);

        // Get or create node
        let node = this.nodeCache.get(absDirPath);

        if (!node) {
            // Create new node
            node = {
                path: absDirPath,
                children: new Map(),
                files: new Set(),
                configFiles: [],
            };

            // Link to parent
            const parentPath = this.pathAdapter.dirname(absDirPath);
            if (parentPath !== absDirPath) {
                const parent = await this.ensureDirectory(parentPath);
                node.parent = parent;
                parent.children.set(this.pathAdapter.basename(absDirPath), node);
            }

            this.nodeCache.set(absDirPath, node);
        }

        // Scan for config/ignore files if not already scanned
        if (!this.scannedDirs.has(absDirPath)) {
            // Scan for .aglintignore
            const ignoreFilePath = this.pathAdapter.join(absDirPath, this.options.ignoreFileName);
            if (await this.fs.exists(ignoreFilePath)) {
                node.ignoreFile = ignoreFilePath;
            }

            // Scan for config files
            for (const configName of this.options.configFileNames) {
                const configPath = this.pathAdapter.join(absDirPath, configName);
                if (await this.fs.exists(configPath)) {
                    node.configFiles.push(configPath);
                }
            }

            this.scannedDirs.add(absDirPath);
        }

        return node;
    }

    /**
     * Gets the ignore chain for a given path.
     * Returns ignore files from the path's directory up to the root.
     *
     * @param targetPath Absolute path to file or directory
     * @returns Array of ignore chain entries (closest first)
     */
    public async getIgnoreChain(targetPath: string): Promise<IgnoreChainEntry[]> {
        const absPath = this.pathAdapter.resolve(targetPath);
        const stats = await this.fs.stat(absPath);
        const dirPath = stats.isDirectory ? absPath : this.pathAdapter.dirname(absPath);

        // Check cache
        if (this.ignoreChainCache.has(dirPath)) {
            return this.ignoreChainCache.get(dirPath)!;
        }

        // Build chain by walking up
        const chain: IgnoreChainEntry[] = [];
        let currentPath = dirPath;

        while (currentPath) {
            await this.ensureDirectory(currentPath);
            const node = this.nodeCache.get(currentPath);

            if (node?.ignoreFile) {
                const content = await this.fs.readFile(node.ignoreFile);
                const patterns = content
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => line && !line.startsWith('#'));

                chain.push({
                    path: node.ignoreFile,
                    directory: currentPath,
                    patterns,
                });
            }

            // Stop at root
            const parentPath = this.pathAdapter.dirname(currentPath);
            if (parentPath === currentPath || !currentPath.startsWith(this.root.path)) {
                break;
            }
            currentPath = parentPath;
        }

        // Cache and return
        this.ignoreChainCache.set(dirPath, chain);
        return chain;
    }

    /**
     * Gets the config chain for a given path.
     * Returns config files from the path's directory up to a root config or filesystem root.
     *
     * @param targetPath Absolute path to file or directory
     * @returns Array of config chain entries (closest first)
     */
    public async getConfigChain(targetPath: string): Promise<ConfigChainEntry[]> {
        const absPath = this.pathAdapter.resolve(targetPath);
        const stats = await this.fs.stat(absPath);
        const dirPath = stats.isDirectory ? absPath : this.pathAdapter.dirname(absPath);

        // Check cache
        if (this.configChainCache.has(dirPath)) {
            return this.configChainCache.get(dirPath)!;
        }

        // Build chain by walking up
        const chain: ConfigChainEntry[] = [];
        let currentPath = dirPath;
        let foundRoot = false;

        while (currentPath && !foundRoot) {
            await this.ensureDirectory(currentPath);
            const node = this.nodeCache.get(currentPath);

            if (node && node.configFiles.length > 0) {
                // Use first config file found (should validate only one exists)
                const configPath = node.configFiles[0]!;

                let config: LinterConfig;
                let isRoot = false;

                if (this.configResolver) {
                    config = await this.configResolver.resolve(configPath);
                    isRoot = await this.configResolver.isRoot(configPath);
                } else {
                    // Fallback: just mark as empty config
                    config = {} as LinterConfig;
                }

                chain.push({
                    path: configPath,
                    directory: currentPath,
                    config,
                    isRoot,
                });

                if (isRoot) {
                    foundRoot = true;
                    break;
                }
            }

            // Stop at root
            const parentPath = this.pathAdapter.dirname(currentPath);
            if (parentPath === currentPath || !currentPath.startsWith(this.root.path)) {
                break;
            }
            currentPath = parentPath;
        }

        // Cache and return
        this.configChainCache.set(dirPath, chain);
        return chain;
    }

    /**
     * Gets the resolved (flattened) config for a given path.
     * Returns the final merged config after resolving the entire chain.
     * This is more efficient than calling getConfigChain + resolver separately.
     *
     * @param targetPath Absolute path to file or directory
     * @returns Resolved linter config
     * @throws Error if no config resolver was provided in constructor
     */
    public async getResolvedConfig(targetPath: string): Promise<LinterConfig> {
        const absPath = this.pathAdapter.resolve(targetPath);
        const stats = await this.fs.stat(absPath);
        const dirPath = stats.isDirectory ? absPath : this.pathAdapter.dirname(absPath);

        // Check cache
        if (this.resolvedConfigCache.has(dirPath)) {
            return this.resolvedConfigCache.get(dirPath)!;
        }

        if (!this.configResolver) {
            throw new Error('Config resolver not provided - cannot resolve configs');
        }

        // Get chain and resolve it
        const chain = await this.getConfigChain(targetPath);

        // Merge configs from farthest to closest (chain is closest-first, so reverse)
        let resolved: LinterConfig = {} as LinterConfig;

        for (let i = chain.length - 1; i >= 0; i -= 1) {
            const entry = chain[i]!;
            resolved = LinterTree.mergeConfigs(resolved, entry.config);
        }

        // Cache and return
        this.resolvedConfigCache.set(dirPath, resolved);
        return resolved;
    }

    /**
     * Invalidates caches when a file changes.
     * Clears cached ignore and config chains for affected directories.
     *
     * @param changedPath Absolute path to the changed file
     * @throws Error if file does not exist
     */
    public async changed(changedPath: string): Promise<void> {
        const absPath = this.pathAdapter.resolve(changedPath);
        const fileName = this.pathAdapter.basename(absPath);
        const dirPath = this.pathAdapter.dirname(absPath);

        // Clear caches for this directory and all children
        for (const [cachedDir] of this.ignoreChainCache) {
            if (cachedDir.startsWith(dirPath)) {
                this.ignoreChainCache.delete(cachedDir);
            }
        }

        for (const [cachedDir] of this.configChainCache) {
            if (cachedDir.startsWith(dirPath)) {
                this.configChainCache.delete(cachedDir);
            }
        }

        for (const [cachedDir] of this.resolvedConfigCache) {
            if (cachedDir.startsWith(dirPath)) {
                this.resolvedConfigCache.delete(cachedDir);
            }
        }

        // Update directory node
        const node = this.nodeCache.get(dirPath);
        if (!node) {
            return;
        }

        // Check if this is an ignore file
        if (fileName === this.options.ignoreFileName) {
            if (await this.fs.exists(absPath)) {
                node.ignoreFile = absPath;
            } else {
                delete node.ignoreFile;
            }
        }

        // Check if this is a config file
        if (this.options.configFileNames.has(fileName)) {
            if (await this.fs.exists(absPath)) {
                if (!node.configFiles.includes(absPath)) {
                    node.configFiles.push(absPath);
                }
            } else {
                node.configFiles = node.configFiles.filter((p) => p !== absPath);
            }
        }
    }

    /**
     * Gets the directory node for a path (for debugging/inspection).
     *
     * @param dirPath Absolute directory path
     * @returns Directory node or undefined
     */
    public getNode(dirPath: string): DirectoryNode | undefined {
        return this.nodeCache.get(this.pathAdapter.resolve(dirPath));
    }

    /**
     * Merges two configs, with the second config taking precedence.
     * Deeply merges the rules object.
     *
     * @param base Base config
     * @param override Override config
     * @returns Merged config
     */
    private static mergeConfigs(base: LinterConfig, override: LinterConfig): LinterConfig {
        return deepMerge(base, override, mergeOptions);
    }

    /**
     * Checks if a path should be ignored based on .aglintignore files.
     * Uses the ignore chain to determine if the path matches any ignore patterns.
     *
     * @param targetPath Absolute path to file or directory
     * @returns True if the path should be ignored
     */
    public async isIgnored(targetPath: string): Promise<boolean> {
        const ignoreChain = await this.getIgnoreChain(targetPath);

        if (ignoreChain.length === 0) {
            return false;
        }

        const matcher = new IgnoreMatcher(this.pathAdapter, this.root.path, ignoreChain);
        return matcher.isIgnored(targetPath);
    }

    /**
     * Clears all caches.
     */
    public clearCaches(): void {
        this.ignoreChainCache.clear();
        this.configChainCache.clear();
        this.resolvedConfigCache.clear();
        this.scannedDirs.clear();
    }
}
