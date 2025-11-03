/**
 * @file Rollup configurations for generating AGLint builds.
 *
 * ! Please ALWAYS use the "pnpm build" command for building!
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import fastGlob from 'fast-glob';
import { type RollupOptions } from 'rollup';
import externals from 'rollup-plugin-node-externals';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDirLocation = path.join(__dirname, 'dist');

const buildConfig: RollupOptions = {
    input: [
        ...(await fastGlob.async(path.join(__dirname, 'src/rules/*.ts'))),
        path.join(__dirname, 'src/index.ts'),
        path.join(__dirname, 'src/cli/cli.ts'),
        path.join(__dirname, 'src/cli/worker.ts'),
    ],
    output: {
        dir: distDirLocation,
        format: 'esm',
        sourcemap: false,
        preserveModules: true,
        preserveModulesRoot: 'src',
    },
    plugins: [
        json({ preferConst: true }),
        commonjs({ sourceMap: false }),
        typescript({
            tsconfig: path.resolve(__dirname, 'tsconfig.build.json'),
            // fail on type errors
            noEmitOnError: true,
        }),
        resolve({ preferBuiltins: false }),
        externals(),
        replace({
            preventAssignment: true,
            values: {
                __IS_TEST__: 'false',
            },
        }),
    ],
};

export default buildConfig;
