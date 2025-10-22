/* eslint-disable no-await-in-loop */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fastGlob from 'fast-glob';
import globParent from 'glob-parent';
import ignore from 'ignore';
import isGlob from 'is-glob';

import { type LinterConfig } from '../linter/config';

import { CONFIG_FILE_NAMES } from './config-file/config-file';
import { makeNodeEnv } from './config-file/node-env';
import { resolveConfigForDir } from './config-file/resolve';
import { NoFilesForPattern } from './errors/no-files-for-pattern';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const IGNORE_FILE_NAME = '.aglintignore';

export const SUPPORTED_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    '.txt',
    '.adblock',
    '.adguard',
    '.ublock',
]);

export const DEFAULT_IGNORE_PATTERNS: ReadonlyArray<string> = [
    'node_modules',
    '.git',
    '.hg',
    '.svn',
    '.DS_Store',
    'Thumbs.db',
];

export const DEFAULT_PATTERN = `**/*.{${Array.from(SUPPORTED_FILE_EXTENSIONS).map((e) => e.slice(1)).join(',')}}`;

export type LinterCliScannedFile = {
    filePath: string; // absolute
    mtime: number;
    size: number;
    linterConfig: LinterConfig;
};

export type LinterCliScanResult = {
    files: LinterCliScannedFile[];
};

export type LinterCliScanOptions = {
    patterns: string[];
    useIgnoreFiles?: boolean;
    ignorePatterns?: string[];
    cwd?: string;
    configFileNames?: ReadonlySet<string>;
    ignoreFileName?: string;
    baseConfig?: Partial<LinterConfig>;
    followSymlinks?: boolean;
};

function toPosix(p: string): string {
    return p.replace(/\\/g, '/');
}

async function computeSearchRoots(patterns: string[], cwd: string): Promise<string[]> {
    const roots = new Set<string>();
    for (const pattern of patterns) {
        if (isGlob(pattern)) {
            const base = globParent(pattern);
            roots.add(toPosix(path.resolve(cwd, base)));
        } else {
            const abs = toPosix(path.resolve(cwd, pattern));
            try {
                // eslint-disable-next-line no-await-in-loop
                const st = await fs.stat(abs);
                roots.add(st.isDirectory() ? abs : toPosix(path.dirname(abs)));
            } catch {
                roots.add(toPosix(path.dirname(abs)));
            }
        }
    }
    if (roots.size === 0) roots.add(cwd);
    return [...roots];
}

async function readIgnoreLines(file: string): Promise<string[]> {
    const raw = await fs.readFile(file, 'utf8');
    return raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
}

/** Ensure each original pattern yields at least one candidate (pre-ignore). */
// FIXME
// async function assertPatternsMatchSomething(originalPatterns: string[], absCwd: string): Promise<void> {
//     for (const pat of originalPatterns) {
//         if (isGlob(pat)) {
//             const hits = await fastGlob(pat, {
//                 cwd: absCwd,
//                 dot: true,
//                 onlyFiles: true,
//                 followSymbolicLinks: true,
//                 absolute: true,
//             });
//             if (hits.length === 0) {
//                 throw new NoFilesForPattern(pat);
//             }
//         } else {
//             // path-like: file or directory must exist (and directory should contain at least one file)
//             const abs = toPosix(path.resolve(absCwd, pat));
//             try {
//                 const st = await fs.stat(abs);
//                 if (st.isFile()) {
//                     // ok
//                 } else if (st.isDirectory()) {
//                     const hits = await fastGlob(`${abs.replace(/\/+$/, '')}/**/*`, {
//                         dot: true,
//                         onlyFiles: true,
//                         followSymbolicLinks: true,
//                         absolute: true,
//                     });
//                     if (hits.length === 0) {
//                         throw new NoFilesForPattern(pat);
//                     }
//                 } else {
//                     throw new NoFilesForPattern(pat);
//                 }
//             } catch {
//                 throw new NoFilesForPattern(pat);
//             }
//         }
//     }
// }

export async function scan(options: LinterCliScanOptions): Promise<LinterCliScanResult> {
    const {
        useIgnoreFiles = true,
        ignorePatterns = [],
        cwd = process.cwd(),
        configFileNames = CONFIG_FILE_NAMES,
        ignoreFileName = '.aglintignore',
        baseConfig = {},
        followSymlinks = false,
    } = options;

    const originalPatterns = options.patterns.length ? options.patterns : [DEFAULT_PATTERN];
    const patterns = originalPatterns.map(toPosix);
    const absCwd = toPosix(path.resolve(cwd));

    // create env HERE from the effective cwd
    const presetsRootAbsPosix = toPosix(path.resolve(__dirname, '../../config-presets'));
    const env = makeNodeEnv(presetsRootAbsPosix);

    const searchRoots = await computeSearchRoots(patterns, absCwd);

    const ig = ignore();
    ig.add(DEFAULT_IGNORE_PATTERNS.map(toPosix));
    if (ignorePatterns.length) {
        ig.add(ignorePatterns.map(toPosix));
    }

    if (useIgnoreFiles) {
        const ignoreFiles = await fastGlob(
            searchRoots.map((root) => `${root.replace(/\/+$/, '')}/**/${ignoreFileName}`),
            {
                cwd: absCwd,
                dot: true,
                onlyFiles: true,
                followSymbolicLinks: followSymlinks,
                unique: true,
                absolute: true,
            },
        );

        for (const file of ignoreFiles) {
            const dir = toPosix(path.dirname(file));
            const lines = await readIgnoreLines(file);
            for (const raw of lines) {
                const neg = raw.startsWith('!');
                const body = neg ? raw.slice(1) : raw;
                const prefixed = body.startsWith('/') ? body.slice(1) : body;
                // POSIX relative path
                const rel = path.posix.relative(absCwd, dir) || '.';
                const final = `${neg ? '!' : ''}${path.posix.join(rel, prefixed)}`;
                ig.add(toPosix(final));
            }
        }
    }

    const expandedPatterns: string[] = [];
    for (const p of patterns) {
        if (isGlob(p)) {
            expandedPatterns.push(p);
            continue;
        }
        const abs = toPosix(path.resolve(absCwd, p));
        try {
            const st = await fs.stat(abs);
            if (st.isFile()) {
                expandedPatterns.push(abs);
            } else if (st.isDirectory()) {
                expandedPatterns.push(`${abs.replace(/\/+$/, '')}/**/*`);
            }
        } catch {
            expandedPatterns.push(p);
        }
    }

    const candidates = await fastGlob(expandedPatterns, {
        cwd: absCwd,
        dot: true,
        onlyFiles: true,
        unique: true,
        followSymbolicLinks: followSymlinks,
        absolute: true,
    });

    const filtered = candidates.filter(
        (abs) => !ig.ignores(path.posix.relative(absCwd, toPosix(abs))),
    );

    const files: LinterCliScannedFile[] = [];
    const perDirCache = new Map<string, LinterConfig>();
    const fileFlattenCache = new Map<string, LinterConfig>();

    // Batch all stat calls in parallel for better performance
    const statPromises = filtered.map((filePathAbs) => fs.stat(filePathAbs));
    const stats = await Promise.all(statPromises);

    for (let i = 0; i < filtered.length; i += 1) {
        const filePathAbs = filtered[i]!;
        const st = stats[i]!;
        const dir = toPosix(path.dirname(filePathAbs));
        const cfg = await resolveConfigForDir(
            env,
            dir,
            absCwd,
            baseConfig,
            configFileNames,
            perDirCache,
            fileFlattenCache,
        );
        files.push({
            filePath: filePathAbs,
            linterConfig: cfg,
            mtime: st.mtime.getTime(),
            size: st.size,
        });
    }

    files.sort((a, b) => b.size - a.size);

    // Validate patterns matched something after scanning (avoids duplicate glob operations)
    if (files.length === 0 && originalPatterns.length > 0) {
        throw new NoFilesForPattern(originalPatterns.join(', '));
    }

    return { files };
}
