/**
 * Simple Rollup configurations for generating AGLint builds.
 *
 * ! Please ALWAYS use the "yarn build" command for building!
 */

import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
import dts from "rollup-plugin-dts";
import shebang from "rollup-plugin-add-shebang";
import nodePolyfills from "rollup-plugin-polyfill-node";
import alias from "@rollup/plugin-alias";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";

const commonPlugins = [externals(), commonjs({ sourceMap: false }), resolve({ preferBuiltins: false })];

// CommonJS build
const aglintCjs = {
    input: "./src/index.ts",
    output: [
        {
            file: `./dist/aglint.cjs`,
            format: "cjs",
            exports: "auto",
            sourcemap: false,
        },
    ],
    plugins: [typescript({ declaration: false }), ...commonPlugins],
};

// ECMAScript build
const aglintEsm = {
    input: "./src/index.ts",
    output: [
        {
            file: `./dist/aglint.esm.js`,
            format: "esm",
            sourcemap: false,
        },
    ],
    plugins: [
        typescript({
            declaration: false,
            compilerOptions: {
                moduleResolution: "node16",
            },
        }),
        ...commonPlugins,
    ],
};

// CLI tool build
const aglintCli = {
    input: "./src/cli.ts",
    // Since the library is built elsewhere, we do not bundle it again in the CLI,
    // so we mark it as an external package here.
    // This path had to be named in tsconfig, as "." or "./something" didn't work here
    external: ["@aglint"],
    output: [
        {
            file: `./dist/cli.js`,
            format: "esm",
            sourcemap: false,
            paths: {
                // The CLI is placed in the same folder as the library, so we simply rewrite the path
                "@aglint": "./aglint.esm.js",
            },
        },
    ],
    plugins: [
        json({ preferConst: true }),
        typescript({
            declaration: false,
            compilerOptions: {
                moduleResolution: "node16",
            },
        }),
        /**
         * Inserting a special "shebang" comment at the beginning of the CLI file
         *
         * @see {@link https://en.wikipedia.org/wiki/Shebang_(Unix)}
         */
        shebang({ include: "./dist/cli.js" }),
        ...commonPlugins,
    ],
};

// Browser builds - the goal is to make everything work by inserting a single .js file.
// File operations are delegated to the CLI tool, the core library only handles strings.
const browserPlugins = [
    typescript({ declaration: false }),
    commonjs({ sourceMap: false }),
    resolve({ preferBuiltins: false, browser: true }),
    nodePolyfills(),
    // The build of CSSTree is a bit complicated (patches, require "emulation", etc.),
    // so here we only specify the pre-built version by an alias
    alias({
        entries: [{ find: "css-tree", replacement: "node_modules/css-tree/dist/csstree.esm.js" }],
    }),
    getBabelOutputPlugin({
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: ["> 1%", "not dead"],
                },
            ],
        ],
        allowAllFormats: true,
    }),
    // TODO: Terser plugin https://github.com/rollup/plugins/issues/1366
];

// Browser-friendly UMD build
const aglintUmd = {
    input: "./src/index.browser.ts",
    output: [
        {
            file: "./dist/aglint.umd.js",
            name: "AGLint",
            format: "umd",
            sourcemap: false,
        },
    ],
    plugins: browserPlugins,
};

// Browser-friendly IIFE build
const aglintIife = {
    input: "./src/index.browser.ts",
    output: [
        {
            file: "./dist/aglint.iife.js",
            name: "AGLint",
            format: "iife",
            sourcemap: false,
        },
    ],
    plugins: browserPlugins,
};

// Merge .d.ts files
const aglintDts = {
    input: "./dist/types/index.d.ts",
    output: [{ file: "dist/aglint.d.ts", format: "es" }],
    plugins: [externals(), dts()],
};

// Export build configs for Rollup
export default [aglintCjs, aglintEsm, aglintCli, aglintUmd, aglintIife, aglintDts];
