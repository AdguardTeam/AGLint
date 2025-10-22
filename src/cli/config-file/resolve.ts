/* eslint-disable no-await-in-loop */
import deepMerge from 'deepmerge';
import * as v from 'valibot';

import type { LinterConfig } from '../../linter/config';
import { toPosix } from '../utils/to-posix';

import {
    EXT_JSON,
    EXT_YAML,
    EXT_YML,
    LinterConfigFileFormat,
    type LinterConfigFileParsed,
    linterConfigFileSchema,
    RC_CONFIG_FILE,
} from './config-file';

const AGLINT_PREFIX = 'aglint:';

type FileStat = {
    isFile: boolean;
    isDirectory: boolean;
};

export interface FsLike {
    /**
     * Read UTF-8 text file.
     */
    readText(file: string): Promise<string>;

    /**
     * Minimal stat interface
     */
    stat(file: string): Promise<FileStat>;
}

export interface PathLike {
    /**
     * POSIX dirname
     */
    dirname(p: string): string;

    /**
     * POSIX basename
     */
    basename(p: string): string;

    /**
     * POSIX join
     */
    join(a: string, b: string): string;
}

export interface PresetResolver {
    /**
     * Resolve `aglint:<name>` into an absolute POSIX path to a config file
     * (e.g. "<ext>/config-presets/<name>.json" or ".yaml").
     */
    resolvePreset(name: string): Promise<string>;
}

export interface ParserLike {
    parseJson(text: string): any;
    parseYaml(text: string): any;
}

export interface ConfigEnv {
    fs: FsLike;
    path: PathLike;
    presets: PresetResolver;
    parser: ParserLike;
}

const mergeOptions: deepMerge.Options = {
    // last-wins for arrays
    arrayMerge: (_dest, source) => source,
};

export type FlattenCache = Map<string, LinterConfig>;

export const getConfigFileFormat = (path: string): LinterConfigFileFormat => {
    const posixPath = toPosix(path);

    if (posixPath === RC_CONFIG_FILE || posixPath.endsWith(`/${RC_CONFIG_FILE}`)) {
        return LinterConfigFileFormat.Json;
    }

    if (posixPath.endsWith(EXT_JSON)) {
        return LinterConfigFileFormat.Json;
    }

    if (posixPath.endsWith(EXT_YAML) || posixPath.endsWith(EXT_YML)) {
        return LinterConfigFileFormat.Yaml;
    }

    throw new Error(`Unsupported config file format "${path}"`);
};

export const parseConfigFileContent = (
    env: ConfigEnv,
    content: string,
    format: LinterConfigFileFormat,
): LinterConfigFileParsed => {
    let configObject: unknown;

    switch (format) {
        case LinterConfigFileFormat.Json:
            configObject = env.parser.parseJson(content);
            break;

        case LinterConfigFileFormat.Yaml:
            configObject = env.parser.parseYaml(content);
            break;

        default:
            throw new Error(`Unsupported config file format "${format}"`);
    }

    return v.parse(linterConfigFileSchema, configObject);
};

function isPathRef(ref: string): boolean {
    return ref.startsWith('.') || ref.startsWith('/') || ref.includes(':/');
}

export async function loadConfigFileFlattened(
    env: ConfigEnv,
    absConfigPath: string, // POSIX absolute
    cache: FlattenCache,
    seen: Set<string> = new Set(),
): Promise<LinterConfig> {
    if (cache.has(absConfigPath)) {
        return cache.get(absConfigPath)!;
    }

    if (seen.has(absConfigPath)) {
        const chain = [...seen, absConfigPath].map(env.path.basename).join(' -> ');
        throw new Error(`Circular "extends" detected: ${chain}`);
    }

    seen.add(absConfigPath);

    const text = await env.fs.readText(absConfigPath);
    const format = getConfigFileFormat(absConfigPath);
    const parsed = parseConfigFileContent(env, text, format);
    const fromDir = env.path.dirname(absConfigPath);

    // 1) resolve + merge extends (left → right, later overrides earlier)
    let mergedFromExtends: LinterConfig = {} as LinterConfig;

    if (parsed.extends?.length) {
        for (const ref of parsed.extends) {
            let refPath: string;

            if (ref.startsWith(AGLINT_PREFIX)) {
                refPath = await env.presets.resolvePreset(ref.slice(AGLINT_PREFIX.length));
            } else if (isPathRef(ref)) {
                if (ref.endsWith(EXT_JSON) || ref.endsWith(EXT_YAML) || ref.endsWith(EXT_YML)) {
                    refPath = env.path.join(fromDir, ref);
                } else {
                    refPath = env.path.join(fromDir, `${ref}${EXT_JSON}`);
                }
            } else {
                throw new Error(`Unsupported "extends" ref "${ref}" (use "${AGLINT_PREFIX}<name>" or relative path).`);
            }

            // eslint-disable-next-line no-await-in-loop
            const sub = await loadConfigFileFlattened(env, refPath, cache, seen);
            mergedFromExtends = deepMerge(mergedFromExtends, sub, mergeOptions);
        }
    }

    // 2) merge local (drop "extends" and "root")
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { extends: _drop, root: _root, ...localRest } = parsed;
    const flattened = deepMerge(mergedFromExtends, localRest, mergeOptions);

    cache.set(absConfigPath, flattened);

    seen.delete(absConfigPath);

    return flattened;
}

export async function resolveConfigForDir(
    env: ConfigEnv,
    absDir: string, // POSIX absolute
    absCwd: string, // POSIX absolute
    baseConfig: Partial<LinterConfig>,
    configFileNames: ReadonlySet<string>,
    perDirCache: Map<string, LinterConfig> = new Map(),
    fileFlattenCache: FlattenCache = new Map(),
): Promise<LinterConfig> {
    if (perDirCache.has(absDir)) {
        return perDirCache.get(absDir)!;
    }

    const parent = env.path.dirname(absDir);
    const isFsRoot = parent === absDir;

    let inherited: LinterConfig;
    if (isFsRoot || absDir === absCwd) {
        inherited = deepMerge({}, baseConfig, mergeOptions) as LinterConfig;
    } else {
        inherited = await resolveConfigForDir(
            env,
            parent,
            absCwd,
            baseConfig,
            configFileNames,
            perDirCache,
            fileFlattenCache,
        );
    }

    // find 0..1 config in this dir
    const hits: string[] = [];

    for (const name of configFileNames) {
        const candidate = env.path.join(absDir, name);
        // eslint-disable-next-line no-await-in-loop
        const st = await env.fs.stat(candidate).catch(() => null);
        if (st?.isFile) {
            hits.push(candidate);
        }
    }

    if (hits.length > 1) {
        const names = hits.map((p) => env.path.basename(p)).join(', ');
        throw new Error(`Multiple config files found in "${absDir}": ${names}`);
    }

    if (hits.length === 0) {
        perDirCache.set(absDir, inherited);
        return inherited;
    }

    const cfgPath = hits[0]!;

    // Read and parse the file once
    const text = await env.fs.readText(cfgPath);
    const format = getConfigFileFormat(cfgPath);
    const parsed = parseConfigFileContent(env, text, format);

    // Check if we need to reset inheritance due to root:true
    let baseHere: LinterConfig = inherited;
    if (parsed.root === true) {
        baseHere = deepMerge({}, baseConfig, mergeOptions) as LinterConfig;
    }

    // Load and flatten (will use cache if already processed)
    const flattenedLocal = await loadConfigFileFlattened(env, cfgPath, fileFlattenCache);
    const finalForDir = deepMerge(baseHere, flattenedLocal, mergeOptions) as LinterConfig;

    perDirCache.set(absDir, finalForDir);

    return finalForDir;
}
