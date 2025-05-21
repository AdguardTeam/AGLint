/**
 * @file Rollup configurations for generating AGLint builds.
 *
 * ! Please ALWAYS use the "pnpm build" command for building!
 */

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import path from 'path';
import { readFileSync } from 'fs';

// Common constants
const ROOT_DIR = './';
const BASE_NAME = 'AGLint';
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

// Generate a banner with the current package & build info
const BANNER = `/*
 * ${BASE_NAME} v${pkg.version} (build date: ${new Date().toUTCString()})
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} license
 * ${pkg.homepage}
 */`;

// Pre-configured TypeScript plugin
const typeScriptPlugin = typescript({
    tsconfig: path.resolve(ROOT_DIR, 'tsconfig.build.json'),
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
];

// ECMAScript build configuration
const esm = {
    input: path.join(ROOT_DIR, 'src', 'index.node.ts'),
    output: [
        {
            dir: distDirLocation,
            format: 'esm',
            sourcemap: false,
            banner: BANNER,
            preserveModules: true,
            preserveModulesRoot: 'src',
        },
    ],
    plugins: nodePlugins,
};

// CLI tool build
const cli = {
    input: path.join(ROOT_DIR, 'src', 'index.cli.ts'),
    output: [
        {
            dir: distDirLocation,
            format: 'esm',
            sourcemap: false,
            banner: BANNER,
            preserveModules: true,
            preserveModulesRoot: 'src',
        },
    ],
    plugins: nodePlugins,
};

// Export build configs for Rollup
export default [
    esm,
    cli,
];
