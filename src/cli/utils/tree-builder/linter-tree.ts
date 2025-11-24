/* eslint-disable no-await-in-loop */
import { deepMerge } from '../../../utils/deep-merge';
import { type LinterConfigFile, PACKAGE_JSON } from '../../config-file/config-file';
import { type ModuleDebugger } from '../debug';
import { type FileSystemAdapter } from '../fs-adapter';
import { type PathAdapter } from '../path-adapter';

import { IgnoreMatcher } from './ignore-matcher';
import {
    type ConfigChainEntry,
    type DirectoryNode,
    type IgnoreChainEntry,
    type LinterTreeOptions,
} from './types';

/**
 * Dynamic directory tree for tracking configs and ignore files.
 * Supports incremental updates and cache invalidation.
 */
export class LinterTree {
    /**
     * The root directory node.
     */
    private root: DirectoryNode;

    /**
     * Map of absolute paths to directory nodes for fast lookup.
     */
    private nodeCache: Map<string, DirectoryNode> = new Map();

    /**
     * Set of directories that have been scanned for config and ignore files.
     */
    private scannedDirs: Set<string> = new Set();

    /**
     * Cache of ignore chains by directory path.
     */
    private ignoreChainCache: Map<string, IgnoreChainEntry[]> = new Map();

    /**
     * Cache of config chains by directory path.
     */
    private configChainCache: Map<string, ConfigChainEntry[]> = new Map();

    /**
     * Cache of resolved merged configurations by directory path.
     */
    private resolvedConfigCache: Map<string, LinterConfigFile> = new Map();

    /**
     * Module debugger for logging.
     */
    private debug?: ModuleDebugger;

    /**
     * Creates a new linter tree instance.
     *
     * @param fs File system adapter for file operations.
     * @param pathAdapter Path adapter for path operations.
     * @param options Tree configuration options.
     * @param configResolver Optional config resolver.
     * @param configResolver.resolve Function to resolve config files.
     * @param configResolver.isRoot Function to check if config is root.
     * @param configResolver.invalidate Optional function to invalidate config cache.
     * @param debug Optional debug instance for logging.
     */
    constructor(
        private fs: FileSystemAdapter,
        private pathAdapter: PathAdapter,
        private options: LinterTreeOptions,
        private configResolver?: {
            resolve: (configPath: string) => Promise<LinterConfigFile>;
            isRoot: (configPath: string) => Promise<boolean>;
            invalidate?: (configPath: string) => void;
        },
        debug?: ModuleDebugger,
    ) {
        const rootPath = this.pathAdapter.resolve(options.root);
        this.root = {
            path: rootPath,
            children: new Map(),
            files: new Set(),
            configFiles: [],
        };
        this.nodeCache.set(rootPath, this.root);
        this.debug = debug;
        if (this.debug) {
            this.debug.log(`Initialized tree with root: ${rootPath}`);
        }
    }

    /**
     * Adds a file to the tree, creating intermediate directories as needed.
     *
     * @param filePath Absolute path to the file.
     */
    public async addFile(filePath: string): Promise<void> {
        const absPath = this.pathAdapter.resolve(filePath);
        const dir = this.pathAdapter.dirname(absPath);

        if (this.debug) {
            this.debug.log(`Adding file: ${absPath}`);
        }

        // Ensure directory node exists
        await this.ensureDirectory(dir);

        // Add file to directory
        const node = this.nodeCache.get(dir);
        if (node) {
            node.files.add(absPath);
            if (this.debug) {
                this.debug.log(`File added to directory node: ${dir}`);
            }
        }
    }

    /**
     * Ensures a directory node exists in the tree, creating parent nodes as needed.
     * Scans for .aglintignore and config files in the directory.
     *
     * @param dirPath Absolute path to the directory.
     *
     * @returns The directory node.
     */
    private async ensureDirectory(dirPath: string): Promise<DirectoryNode> {
        const absDirPath = this.pathAdapter.resolve(dirPath);

        // Get or create node
        let node = this.nodeCache.get(absDirPath);

        if (!node) {
            // Create new node
            if (this.debug) {
                this.debug.log(`Creating directory node: ${absDirPath}`);
            }
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
                if (this.debug) {
                    this.debug.log(`Linked ${absDirPath} to parent: ${parentPath}`);
                }
            }

            this.nodeCache.set(absDirPath, node);
        }

        // Scan for config/ignore files if not already scanned
        if (!this.scannedDirs.has(absDirPath)) {
            if (this.debug) {
                this.debug.log(`Scanning directory for config/ignore files: ${absDirPath}`);
            }

            // Scan for .aglintignore
            const ignoreFilePath = this.pathAdapter.join(absDirPath, this.options.ignoreFileName);
            if (await this.fs.exists(ignoreFilePath)) {
                node.ignoreFile = ignoreFilePath;
                if (this.debug) {
                    this.debug.log(`Found ignore file: ${ignoreFilePath}`);
                }
            }

            if (this.debug && !node.ignoreFile) {
                this.debug.log(`No ignore file in: ${absDirPath}`);
            }

            // Scan for config files
            for (const configName of this.options.configFileNames) {
                const configPath = this.pathAdapter.join(absDirPath, configName);
                if (await this.fs.exists(configPath)) {
                    // Special handling for package.json - only include if it has "aglint" property
                    if (configName === PACKAGE_JSON) {
                        try {
                            const content = await this.fs.readFile(configPath);
                            const parsed = JSON.parse(content);
                            if (parsed.aglint && !node.configFiles.includes(configPath)) {
                                node.configFiles.push(configPath);
                                if (this.debug) {
                                    this.debug.log(`Found config in package.json: ${configPath}`);
                                }
                            }
                        } catch {
                            // If we can't read/parse package.json, skip it
                        }
                    } else if (!node.configFiles.includes(configPath)) {
                        node.configFiles.push(configPath);
                        if (this.debug) {
                            this.debug.log(`Found config file: ${configPath}`);
                        }
                    }
                }
            }

            // Validate that only one config file exists in this directory
            if (node.configFiles.length > 1) {
                const fileNames = node.configFiles.map((p) => this.pathAdapter.basename(p)).join(', ');
                throw new Error(
                    `Multiple config files found in "${absDirPath}": ${fileNames}. `
                    + 'Please use only one config file per directory.',
                );
            }

            if (node.configFiles.length === 0) {
                if (this.debug) {
                    this.debug.log(`No config file in: ${absDirPath}`);
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
     * @param targetPath Absolute path to file or directory.
     *
     * @returns Array of ignore chain entries (closest first).
     */
    public async getIgnoreChain(targetPath: string): Promise<IgnoreChainEntry[]> {
        const absPath = this.pathAdapter.resolve(targetPath);
        const stats = await this.fs.stat(absPath);
        const dirPath = stats.isDirectory ? absPath : this.pathAdapter.dirname(absPath);

        // Check cache
        if (this.ignoreChainCache.has(dirPath)) {
            const chain = this.ignoreChainCache.get(dirPath)!;
            const chainPaths = chain.map((entry) => entry.path).join(' <- ');
            if (this.debug) {
                this.debug.log(`Using cached ignore chain (${chain.length} file(s)) for ${dirPath}: ${chainPaths}`);
            }
            return chain;
        }

        if (this.debug) {
            this.debug.log(`Building ignore chain for: ${dirPath}`);
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

                if (this.debug) {
                    this.debug.log(`Adding ignore file to chain: ${node.ignoreFile} (${patterns.length} pattern(s))`);
                }
                if (patterns.length > 0) {
                    if (this.debug) {
                        this.debug.log(`Patterns: [${patterns.join(', ')}]`);
                    }
                }

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
        if (this.debug) {
            if (chain.length > 0) {
                const chainPaths = chain.map((entry) => entry.path).join(' <- ');
                const totalPatterns = chain.reduce((sum, entry) => sum + entry.patterns.length, 0);
                this.debug.log(
                    `Built ignore chain with ${chain.length} file(s), ${totalPatterns} total pattern(s) `
                    + `for ${dirPath}: ${chainPaths}`,
                );
            } else {
                this.debug.log(`No ignore files in chain for: ${dirPath}`);
            }
        }
        return chain;
    }

    /**
     * Gets the config chain for a given path.
     * Returns config files from the path's directory up to a root config or filesystem root.
     *
     * @param targetPath Absolute path to file or directory.
     *
     * @returns Array of config chain entries (closest first).
     */
    public async getConfigChain(targetPath: string): Promise<ConfigChainEntry[]> {
        const absPath = this.pathAdapter.resolve(targetPath);
        const stats = await this.fs.stat(absPath);
        const dirPath = stats.isDirectory ? absPath : this.pathAdapter.dirname(absPath);

        // Check cache
        if (this.configChainCache.has(dirPath)) {
            const chain = this.configChainCache.get(dirPath)!;
            if (this.debug) {
                const chainPaths = chain.map((entry) => entry.path).join(' <- ');
                this.debug.log(
                    `Using cached config chain (${chain.length} config(s)) for ${dirPath}: ${chainPaths}`,
                );
            }
            return chain;
        }

        if (this.debug) {
            this.debug.log(`Building config chain for: ${dirPath}`);
        }

        // Build chain by walking up
        const chain: ConfigChainEntry[] = [];
        let currentPath = dirPath;
        let foundRoot = false;

        while (currentPath && !foundRoot) {
            await this.ensureDirectory(currentPath);
            const node = this.nodeCache.get(currentPath);

            if (node && node.configFiles.length > 0) {
                // Only one config file per directory is allowed (validated during scanning)
                const configPath = node.configFiles[0]!;

                let config: LinterConfigFile;
                let isRoot = false;

                if (this.configResolver) {
                    config = await this.configResolver.resolve(configPath);
                    isRoot = await this.configResolver.isRoot(configPath);
                    if (this.debug) {
                        this.debug.log(
                            `Adding config to chain: ${configPath} (root: ${isRoot})`,
                        );
                    }
                } else {
                    // Fallback: just mark as empty config
                    config = {} as LinterConfigFile;
                    if (this.debug) {
                        this.debug.log(`Adding config to chain (no resolver): ${configPath}`);
                    }
                }

                chain.push({
                    path: configPath,
                    directory: currentPath,
                    config,
                    isRoot,
                });

                if (isRoot) {
                    if (this.debug) {
                        this.debug.log(`Stopping at root config: ${configPath}`);
                    }
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
        if (this.debug) {
            if (chain.length > 0) {
                const chainPaths = chain.map((entry) => entry.path).join(' <- ');
                const rootMarkers = chain.map((entry) => (entry.isRoot ? 'R' : '-')).join('');
                this.debug.log(
                    `Built config chain with ${chain.length} config(s) [${rootMarkers}] for ${dirPath}: ${chainPaths}`,
                );
            } else {
                this.debug.log(`No config files in chain for: ${dirPath}`);
            }
        }
        return chain;
    }

    /**
     * Gets the resolved (flattened) config for a given path.
     * Returns the final merged config after resolving the entire chain.
     * This is more efficient than calling getConfigChain + resolver separately.
     *
     * @param targetPath Absolute path to file or directory.
     *
     * @returns Resolved linter config.
     *
     * @throws Error if no config resolver was provided in constructor.
     */
    public async getResolvedConfig(targetPath: string): Promise<LinterConfigFile> {
        const absPath = this.pathAdapter.resolve(targetPath);
        const stats = await this.fs.stat(absPath);
        const dirPath = stats.isDirectory ? absPath : this.pathAdapter.dirname(absPath);

        if (this.debug) {
            this.debug.log(`Getting resolved config for: ${targetPath}`);
        }

        // Check cache
        if (this.resolvedConfigCache.has(dirPath)) {
            if (this.debug) {
                this.debug.log(`Using cached resolved config for: ${dirPath}`);
            }
            return this.resolvedConfigCache.get(dirPath)!;
        }

        if (!this.configResolver) {
            throw new Error('Config resolver not provided - cannot resolve configs');
        }

        // Get chain and resolve it
        const chain = await this.getConfigChain(targetPath);

        // Merge configs from farthest to closest (chain is closest-first, so reverse)
        let resolved: LinterConfigFile = {} as LinterConfigFile;

        if (this.debug) {
            this.debug.log(`Merging ${chain.length} config(s) for resolved config`);
        }
        for (let i = chain.length - 1; i >= 0; i -= 1) {
            const entry = chain[i]!;
            resolved = LinterTree.mergeConfigs(resolved, entry.config);
        }

        if (this.debug) {
            this.debug.log(`Resolved config: ${JSON.stringify(resolved)}`);
        }

        // Cache and return
        this.resolvedConfigCache.set(dirPath, resolved);
        return resolved;
    }

    /**
     * Invalidates caches when a file changes.
     * Clears cached ignore and config chains for affected directories.
     *
     * @param changedPath Absolute path to the changed file.
     */
    public async changed(changedPath: string): Promise<void> {
        const absPath = this.pathAdapter.resolve(changedPath);
        const fileName = this.pathAdapter.basename(absPath);
        const dirPath = this.pathAdapter.dirname(absPath);

        const isIgnoreFile = fileName === this.options.ignoreFileName;
        const isConfigFile = this.options.configFileNames.has(fileName);

        // If this is a config or ignore file, mark directory for rescan
        if (isIgnoreFile || isConfigFile) {
            this.scannedDirs.delete(dirPath);

            if (this.debug) {
                const fileType = isIgnoreFile ? 'ignore' : 'config';
                this.debug.log(
                    `Marking directory for rescan due to ${fileType} file change: ${dirPath}`,
                );
            }
        }

        // Clear caches for this directory and all children (descendant directories)
        // Use proper path matching to avoid clearing sibling directories (e.g., /sub vs /subfolder)
        const pathSep = this.pathAdapter.sep;
        for (const [cachedDir] of this.ignoreChainCache) {
            if (cachedDir === dirPath || cachedDir.startsWith(dirPath + pathSep)) {
                this.ignoreChainCache.delete(cachedDir);
                if (this.debug) {
                    this.debug.log(`Cleared ignore chain cache for: ${cachedDir}`);
                }
            }
        }

        for (const [cachedDir] of this.configChainCache) {
            if (cachedDir === dirPath || cachedDir.startsWith(dirPath + pathSep)) {
                this.configChainCache.delete(cachedDir);
                if (this.debug) {
                    this.debug.log(`Cleared config chain cache for: ${cachedDir}`);
                }
            }
        }

        for (const [cachedDir] of this.resolvedConfigCache) {
            if (cachedDir === dirPath || cachedDir.startsWith(dirPath + pathSep)) {
                this.resolvedConfigCache.delete(cachedDir);
                if (this.debug) {
                    this.debug.log(`Cleared resolved config cache for: ${cachedDir}`);
                }
            }
        }

        // Update directory node to reflect current file state
        const node = this.nodeCache.get(dirPath);
        if (!node) {
            return;
        }

        // Check if this is an ignore file
        if (isIgnoreFile) {
            if (await this.fs.exists(absPath)) {
                node.ignoreFile = absPath;
                if (this.debug) {
                    this.debug.log(`Updated ignore file in node: ${absPath}`);
                }
            } else {
                delete node.ignoreFile;
                if (this.debug) {
                    this.debug.log(`Removed ignore file from node: ${absPath}`);
                }
            }
        }

        // Check if this is a config file
        if (isConfigFile) {
            // Invalidate config resolver cache if available
            if (this.configResolver?.invalidate) {
                this.configResolver.invalidate(absPath);
                if (this.debug) {
                    this.debug.log(`Invalidated config resolver cache for: ${absPath}`);
                }
            }

            if (await this.fs.exists(absPath)) {
                if (!node.configFiles.includes(absPath)) {
                    node.configFiles.push(absPath);
                    if (this.debug) {
                        this.debug.log(`Added config file to node: ${absPath}`);
                    }
                } else if (this.debug) {
                    this.debug.log(`Config file already in node, will be rescanned: ${absPath}`);
                }
            } else {
                node.configFiles = node.configFiles.filter((p) => p !== absPath);
                if (this.debug) {
                    this.debug.log(`Removed config file from node: ${absPath}`);
                }
            }
        }
    }

    /**
     * Gets the directory node for a path (for debugging/inspection).
     *
     * @param dirPath Absolute directory path.
     *
     * @returns Directory node or undefined.
     */
    public getNode(dirPath: string): DirectoryNode | undefined {
        return this.nodeCache.get(this.pathAdapter.resolve(dirPath));
    }

    /**
     * Merges two configs, with the second config taking precedence.
     * Deeply merges the rules object.
     *
     * @param base Base config.
     * @param override Override config.
     *
     * @returns Merged config.
     */
    private static mergeConfigs(base: LinterConfigFile, override: LinterConfigFile): LinterConfigFile {
        return deepMerge(base, override);
    }

    /**
     * Checks if a path should be ignored based on .aglintignore files.
     * Uses the ignore chain to determine if the path matches any ignore patterns.
     *
     * @param targetPath Absolute path to file or directory.
     *
     * @returns True if the path should be ignored.
     */
    public async isIgnored(targetPath: string): Promise<boolean> {
        const ignoreChain = await this.getIgnoreChain(targetPath);

        if (ignoreChain.length === 0) {
            if (this.debug) {
                this.debug.log(`No ignore chain for ${targetPath}, not ignored`);
            }
            return false;
        }

        const matcher = new IgnoreMatcher(this.pathAdapter, this.root.path, ignoreChain);
        const result = matcher.isIgnored(targetPath);
        if (this.debug) {
            this.debug.log(`Ignore check for ${targetPath}: ${result ? 'IGNORED' : 'NOT IGNORED'}`);
        }
        return result;
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
