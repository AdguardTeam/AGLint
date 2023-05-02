/**
 * Simple Rollup configurations for generating AGLint builds.
 *
 * ! Please ALWAYS use the "yarn build" command for building!
 */

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-node-externals';
import dts from 'rollup-plugin-dts';
import shebang from 'rollup-plugin-add-shebang';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import alias from '@rollup/plugin-alias';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { fileURLToPath } from 'url';

const commonPlugins = [
    json(),
    externals(),
    commonjs({ sourceMap: false }),
    resolve({ preferBuiltins: false }),
];

const typeScriptPlugin = typescript({
    declaration: true,
    declarationDir: './dist/types',
    rootDir: './',
});

// CommonJS build
const aglintCjs = {
    input: './src/index.ts',
    output: [
        {
            file: './dist/aglint.cjs',
            format: 'cjs',
            exports: 'auto',
            sourcemap: false,
        },
    ],
    plugins: [
        ...commonPlugins,
        typeScriptPlugin,
    ],
};

// ECMAScript build
const aglintEsm = {
    input: './src/index.ts',
    output: [
        {
            file: './dist/aglint.esm.js',
            format: 'esm',
            sourcemap: false,
        },
    ],
    plugins: [
        ...commonPlugins,
        typeScriptPlugin,
    ],
};

// Path to the index file of the library
const linterIndex = fileURLToPath(
    new URL(
        'src/index.ts',
        import.meta.url,
    ),
);

// CLI tool build
const aglintCli = {
    input: './src/cli.ts',
    output: [
        {
            file: './dist/cli.js',
            format: 'esm',
            sourcemap: false,
            // Replace import './index' with './aglint.esm.js'
            paths: {
                [linterIndex]: './aglint.esm.js',
            },
        },
    ],
    external: [
        // It is no makes sense to bundle the core library into the CLI tool,
        // so we exclude it from the build and instead we import it from the
        // same directory where the CLI tool is located
        linterIndex,
    ],
    plugins: [
        json({ preferConst: true }),
        typeScriptPlugin,
        /**
         * Inserting a special "shebang" comment at the beginning of the CLI file
         *
         * @see {@link https://en.wikipedia.org/wiki/Shebang_(Unix)}
         */
        shebang({ include: './dist/cli.js' }),
        ...commonPlugins,
    ],
};

// Browser builds - the goal is to make everything work by inserting a single .js file.
// File operations are delegated to the CLI tool, the core library only handles strings.
const browserPlugins = [
    json({ preferConst: true }),
    typeScriptPlugin,
    commonjs({ sourceMap: false }),
    resolve({ preferBuiltins: false, browser: true }),
    nodePolyfills(),
    // The build of CSSTree is a bit complicated (patches, require "emulation", etc.),
    // so here we only specify the pre-built version by an alias
    alias({
        entries: [
            { find: '@adguard/ecss-tree', replacement: 'node_modules/@adguard/ecss-tree/dist/ecsstree.umd.min.js' },
        ],
    }),
    getBabelOutputPlugin({
        presets: [
            [
                '@babel/preset-env',
            ],
        ],
        allowAllFormats: true,
        compact: false,
    }),
    terser(),
];

// Browser-friendly UMD build
const aglintUmd = {
    input: './src/index.browser.ts',
    output: [
        {
            file: './dist/aglint.umd.min.js',
            name: 'AGLint',
            format: 'umd',
            sourcemap: false,
        },
    ],
    plugins: browserPlugins,
};

// Browser-friendly IIFE build
const aglintIife = {
    input: './src/index.browser.ts',
    output: [
        {
            file: './dist/aglint.iife.min.js',
            name: 'AGLint',
            format: 'iife',
            sourcemap: false,
        },
    ],
    plugins: browserPlugins,
};

// Merge .d.ts files
const aglintDts = {
    input: './dist/types/src/index.d.ts',
    output: [{ file: './dist/aglint.d.ts', format: 'es' }],
    plugins: [externals(), dts()],
};

// Export build configs for Rollup
export default [aglintCjs, aglintEsm, aglintCli, aglintUmd, aglintIife, aglintDts];
