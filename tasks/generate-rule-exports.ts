/* eslint-disable no-await-in-loop */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import fg from 'fast-glob';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = new URL('.', import.meta.url).pathname;

/**
 * Generates rule exports.
 */
async function main() {
    const files = await fg([path.join(__dirname, '../src/rules/*.ts')]);
    const packageJson = JSON.parse(await readFile(path.join(__dirname, '../package.json'), 'utf-8'));

    // clear existing rule exports
    for (const key of Object.keys(packageJson.exports)) {
        if (key.startsWith('./rules/')) {
            delete packageJson.exports[key];
        }
    }

    for (const file of files) {
        const { name } = path.parse(file);

        packageJson.exports[`./rules/${name}`] = {
            types: `./dist/rules/${name}.d.ts`,
            import: `./dist/rules/${name}.js`,
            default: `./dist/rules/${name}.js`,
        };
    }

    await writeFile(path.join(__dirname, '../package.json'), `${JSON.stringify(packageJson, null, 4)}\n`);
}

main();
