import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
import dts from "rollup-plugin-dts";

const esm = {
    input: "./src/index.ts",
    output: [
        {
            file: `./dist/aglint.mjs`,
            format: "esm",
            sourcemap: false,
        },
    ],
    plugins: [
        externals(),
        typescript({
            declaration: false,
            compilerOptions: {
                moduleResolution: "node16",
            },
        }),
        commonjs({ sourceMap: false }),
        resolve({ preferBuiltins: false }),
    ],
};

const cjs = {
    input: "./src/index.ts",
    output: [
        {
            file: `./dist/aglint.cjs`,
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

export default [
    esm,
    cjs,
    {
        input: "./dist/types/index.d.ts",
        output: [{ file: "dist/aglint.d.ts", format: "es" }],
        plugins: [dts()],
    },
];
