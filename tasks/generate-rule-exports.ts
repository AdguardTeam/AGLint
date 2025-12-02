/* eslint-disable no-await-in-loop */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fg from 'fast-glob';

import { formatJson } from '../src/utils/format-json';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJsonPath = path.join(__dirname, '../package.json');

/**
 * Generates rule exports.
 */
async function main() {
    const files = await fg([path.join(__dirname, '../src/rules/*.ts')]);
    const originalRawPkg = await readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(originalRawPkg);

    // clear existing rule exports
    for (const key of Object.keys(pkg.exports)) {
        if (key.startsWith('./rules/')) {
            delete pkg.exports[key];
        }
    }

    for (const file of files) {
        const { name } = path.parse(file);

        pkg.exports[`./rules/${name}`] = {
            types: `./dist/rules/${name}.d.ts`,
            import: `./dist/rules/${name}.js`,
            default: `./dist/rules/${name}.js`,
        };
    }

    const updatedRawPkg = formatJson(pkg, originalRawPkg);
    await writeFile(packageJsonPath, updatedRawPkg);
}

main();
