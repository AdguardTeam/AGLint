import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";

const esm = {
    input: "src/parser/index.ts",
    output: [
        {
            file: `dist/parser/index.mjs`,
            format: "esm",
            sourcemap: false,
        },
    ],
    plugins: [
        externals(),
        typescript({ declaration: false }),
        commonjs({ sourceMap: false }),
        resolve({ preferBuiltins: false }),
    ],
};

const cjs = {
    input: "src/parser/index.ts",
    output: [
        {
            file: `dist/parser/index.cjs`,
            format: "cjs",
            exports: "auto",
            sourcemap: false,
        },
    ],
    plugins: [
        externals(),
        typescript({ declaration: false }),
        commonjs({ sourceMap: false }),
        resolve({ preferBuiltins: false }),
    ],
};

export default [esm, cjs];
