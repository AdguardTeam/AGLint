/** @type {import('lint-staged').Configuration} */
import path from 'node:path';

/**
 * Make file path relative to the current working directory
 *
 * @param {string} file File path
 *
 * @returns {string} Relative path
 */
const makeRelative = (file) => path.relative(process.cwd(), file);

export default {
    '**/*.md': 'markdownlint',
    '**/*.js': 'eslint',
    '**/*.ts': [
        // Type-check only the staged TS files while still honoring tsconfig
        'tsc-files --noEmit',

        // Run tests that are related to those changed files
        (files) => `vitest related --run ${files.map(makeRelative).join(' ')}`,

        // Lint the staged TS files
        'eslint',
    ],
};
