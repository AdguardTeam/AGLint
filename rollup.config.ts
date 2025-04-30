/**
 * @file Rollup configurations for generating AGLint builds.
 *
 * ! Please ALWAYS use the "pnpm build" command for building!
 */

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-node-externals';
import dtsPlugin from 'rollup-plugin-dts';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import { MIN_SUPPORTED_VERSION } from './constants';

// Common constants
const ROOT_DIR = './';
const BASE_NAME = 'AGLint';
const BASE_FILE_NAME = 'aglint';
const PKG_FILE_NAME = 'package.json';

const distDirLocation = path.join(ROOT_DIR, 'dist');
const pkgFileLocation = path.join(ROOT_DIR, PKG_FILE_NAME);

// Read package.json
const pkg = JSON.parse(readFileSync(pkgFileLocation, 'utf-8'));

// Check if the package.json file has all required fields
// (we need them for the banner)
const REQUIRED_PKG_FIELDS = [
    'author',
    'homepage',
    'license',
    'version',
];

for (const field of REQUIRED_PKG_FIELDS) {
    if (!(field in pkg)) {
        throw new Error(`Missing required field "${field}" in ${PKG_FILE_NAME}`);
    }
}

/**
 * Shebang for Node.js CLI build
 *
 * @see {@link https://en.wikipedia.org/wiki/Shebang_(Unix)}
 */
const SHEBANG = '#!/usr/bin/env node';

// Generate a banner with the current package & build info
const BANNER = `/*
 * ${BASE_NAME} v${pkg.version} (build date: ${new Date().toUTCString()})
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} license
 * ${pkg.homepage}
 */`;

// Pre-configured TypeScript plugin
const typeScriptPlugin = typescript({
    compilerOptions: {
        // Don't emit declarations, we will do it in a separate command "pnpm build-types"
        declaration: false,
    },
});

const babelOutputPluginForNode = getBabelOutputPlugin({
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: MIN_SUPPORTED_VERSION.CLI_NODE,
                },
            },
        ],
    ],
    allowAllFormats: true,
    compact: false,
});

// Common plugins for all types of builds
const commonPlugins = [
    json({ preferConst: true }),
    commonjs({ sourceMap: false }),
    typeScriptPlugin,
];

// Plugins for Node.js builds
const nodePlugins = [
    ...commonPlugins,
    resolve({ preferBuiltins: false }),
    externals(),
    babelOutputPluginForNode,
];

// Plugins for browser builds
const browserPlugins = [
    ...commonPlugins,
    resolve({
        browser: true,
        preferBuiltins: false,
    }),
    nodePolyfills(),
    // Provide better browser compatibility with Babel
    getBabelOutputPlugin({
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        // https://github.com/browserslist/browserslist#best-practices
                        browsers: [
                            'last 1 version',
                            '> 1%',
                            'not dead',

                            // Specific versions
                            `chrome >= ${MIN_SUPPORTED_VERSION.CHROME}`,
                            `firefox >= ${MIN_SUPPORTED_VERSION.FIREFOX}`,
                            `edge >= ${MIN_SUPPORTED_VERSION.EDGE}`,
                            `opera >= ${MIN_SUPPORTED_VERSION.OPERA}`,
                            `safari >= ${MIN_SUPPORTED_VERSION.SAFARI}`,
                        ],
                    },
                },
            ],
        ],
        allowAllFormats: true,
        compact: false,
    }),
    // Minify the output with Terser
    terser({
        output: {
            // Keep the banner in the minified output
            preamble: BANNER,
        },
    }),
];

// CommonJS build configuration
const cjs = {
    input: path.join(ROOT_DIR, 'src', 'index.node.ts'),
    output: [
        {
            file: path.join(distDirLocation, `${BASE_FILE_NAME}.js`),
            format: 'cjs',
            exports: 'auto',
            sourcemap: false,
            banner: BANNER,
        },
    ],
    plugins: nodePlugins,
};

// ECMAScript build configuration
const esm = {
    input: path.join(ROOT_DIR, 'src', 'index.node.ts'),
    output: [
        {
            file: path.join(distDirLocation, `${BASE_FILE_NAME}.esm.mjs`),
            format: 'esm',
            sourcemap: false,
            banner: BANNER,
        },
    ],
    plugins: nodePlugins,
};

// Path to the index file of the library
const linterIndex = fileURLToPath(
    new URL(
        path.join(ROOT_DIR, 'src', 'index.node.ts'),
        import.meta.url,
    ),
);

// CLI tool build
const cli = {
    input: path.join(ROOT_DIR, 'src', 'index.cli.ts'),
    output: [
        {
            file: path.join(distDirLocation, `${BASE_FILE_NAME}.cli.js`),
            format: 'cjs',
            sourcemap: false,
            // Replace import './index.node' with './aglint.js'
            paths: {
                [linterIndex]: path.join('./', `${BASE_FILE_NAME}.js`),
            },
            banner: `${SHEBANG}\n${BANNER}`,
        },
    ],
    external: [
        // It is no makes sense to bundle the core library into the CLI tool,
        // so we exclude it from the build and instead we import it from the
        // same directory where the CLI tool is located
        linterIndex,
    ],
    plugins: nodePlugins,
};

// Browser-friendly UMD build configuration
const umd = {
    input: path.join(ROOT_DIR, 'src', 'index.browser.ts'),
    output: [
        {
            file: path.join(distDirLocation, `${BASE_FILE_NAME}.umd.min.js`),
            name: BASE_NAME,
            format: 'umd',
            sourcemap: false,
            banner: BANNER,
        },
    ],
    plugins: browserPlugins,
};

// Browser-friendly IIFE build configuration
const iife = {
    input: path.join(ROOT_DIR, 'src', 'index.browser.ts'),
    output: [
        {
            file: path.join(distDirLocation, `${BASE_FILE_NAME}.iife.min.js`),
            name: BASE_NAME,
            format: 'iife',
            sourcemap: false,
            banner: BANNER,
        },
    ],
    plugins: browserPlugins,
};

// Merge .d.ts files (requires `tsc` to be run first,
// because it merges .d.ts files from `dist/types` directory)
const dts = {
    input: path.join(ROOT_DIR, 'dist', 'types', 'src', 'index.node.d.ts'),
    output: [
        {
            file: path.join(distDirLocation, `${BASE_FILE_NAME}.d.ts`),
            format: 'es',
            banner: BANNER,
        },
    ],
    plugins: [
        externals(),
        dtsPlugin(),
    ],
};

// Export build configs for Rollup
export default [
    dts,
    cjs,
    esm,
    cli,
    umd,
    iife,
];
