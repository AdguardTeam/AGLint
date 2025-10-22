import fs from 'node:fs/promises';
import path from 'node:path';

import { parse as yamlParse } from 'yaml';

import { toPosix } from '../utils/to-posix';

import { EXT_JSON } from './config-file';
import type {
    ConfigEnv,
    FsLike,
    ParserLike,
    PathLike,
    PresetResolver,
} from './resolve';

const fsLike: FsLike = {
    async readText(file) {
        return fs.readFile(file, 'utf8');
    },
    async stat(file) {
        const s = await fs.stat(file);
        return { isFile: s.isFile(), isDirectory: s.isDirectory() };
    },
};

const pathLike: PathLike = {
    dirname: (p) => path.posix.dirname(toPosix(p)),
    basename: (p) => path.posix.basename(toPosix(p)),
    join: (a, b) => toPosix(path.posix.join(toPosix(a), b)),
};

export function makeNodePresetResolver(presetsRootAbsPosix: string): PresetResolver {
    return {
        async resolvePreset(name: string) {
            return `${presetsRootAbsPosix}/${name}${EXT_JSON}`;
        },
    };
}

const parserLike: ParserLike = {
    parseJson: (t) => JSON.parse(t),
    parseYaml: (t) => yamlParse(t),
};

export function makeNodeEnv(presetsRootAbsPosix: string): ConfigEnv {
    return {
        fs: fsLike,
        path: pathLike,
        presets: makeNodePresetResolver(presetsRootAbsPosix),
        parser: parserLike,
    };
}
