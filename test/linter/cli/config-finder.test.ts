// import path from 'path';
import { join, relative, resolve } from 'path';
import { configFinder, findNextConfig, findNextRootConfig } from '../../../src/linter/cli/config-finder';

const projectRoot = resolve(__dirname, '../../../');

/**
 * Checks if the given path is located outside of the project root directory.
 * This is needed because we may find a config file outside of the project root
 * directory, which can break these tests if we don't check for that.
 *
 * @param path Path to the config file
 * @returns `true` if the config file is located outside of the project root directory
 */
function isExternalPath(path: string): boolean {
    // Get the relative path from the project root directory to the config file
    const relativePath = relative(projectRoot, path);

    // If the result is outside of the project root directory, then the relative
    // path will start with '..'
    return relativePath.startsWith('..');
}

describe('config-finder', () => {
    describe('configFinder', () => {
        test('should throw an error if multiple config files are found in the same directory', async () => {
            const base = 'test/fixtures/config-finder/invalid';
            const cwd = join(base, 'subdir');

            // ESLint uses hierarchical config files, but we simply throw an error
            // if multiple config files are found in the same directory
            await expect(configFinder(cwd, () => false)).rejects.toThrowError(
                `Multiple config files found in ${resolve(projectRoot, base)}`,
            );
        });

        test('callback shouldn\'t be called if no config file is found', async () => {
            const cwd = 'test/fixtures/config-finder/nothing';
            let callbackCalled = false;

            await expect(configFinder(cwd, (path) => {
                if (!isExternalPath(path)) {
                    callbackCalled = true;
                }

                // Continue the search
                return false;
            })).resolves.toBeUndefined();

            // Collected path should be empty
            expect(callbackCalled).toBeFalsy();
        });

        test('callback should be called if a config file is found', async () => {
            const cwd = 'test/fixtures/config-finder/valid/subdir1/subdir2/subdir3';
            const configPaths: string[] = [];

            await expect(configFinder(cwd, (path) => {
                if (!isExternalPath(path)) {
                    configPaths.push(path);
                }

                // Continue the search
                return false;
            })).resolves.toBeUndefined();

            expect(configPaths).toHaveLength(2);

            // Please note that configFinder() only looks for file names, not for
            // the actual file contents, so it may find a config file that is not
            // actually valid
            expect(configPaths).toEqual([
                resolve(projectRoot, 'test/fixtures/config-finder/valid/subdir1/subdir2/.aglintrc.yml'),
                resolve(projectRoot, 'test/fixtures/config-finder/valid/subdir1/.aglintrc.yml'),
            ]);
        });
    });

    describe('findNextConfig', () => {
        test('should throw an error if multiple config files are found in the same directory', async () => {
            const base = 'test/fixtures/config-finder/invalid';
            const cwd = join(base, 'subdir');

            // ESLint uses hierarchical config files, but we simply throw an error
            // if multiple config files are found in the same directory
            await expect(findNextConfig(cwd)).rejects.toThrowError(
                `Multiple config files found in ${resolve(projectRoot, base)}`,
            );
        });

        test('should return `null` if no config file is found', async () => {
            const cwd = 'test/fixtures/config-finder/nothing';

            const result = await findNextConfig(cwd);

            if (result !== null) {
                if (isExternalPath(result.path)) {
                    // If the result is located outside of the project root directory,
                    // then it is safe to ignore it
                    return;
                }

                // If the result is located inside of the project root directory,
                // then it is an error
                throw new Error(`Unexpected config file found: ${result.path}`);
            }
        });

        test('should return the path to the first config file found', async () => {
            const cwd = 'test/fixtures/config-finder/valid/subdir1/subdir2/subdir3';

            await expect(findNextConfig(cwd)).resolves.toMatchObject({
                path: resolve(projectRoot, 'test/fixtures/config-finder/valid/subdir1/subdir2/.aglintrc.yml'),
            });
        });
    });

    describe('findNextRootConfig', () => {
        test('should throw an error if multiple config files are found in the same directory', async () => {
            const base = 'test/fixtures/config-finder/invalid';
            const cwd = join(base, 'subdir');

            // ESLint uses hierarchical config files, but we simply throw an error
            // if multiple config files are found in the same directory
            await expect(findNextRootConfig(cwd)).rejects.toThrowError(
                `Multiple config files found in ${resolve(projectRoot, base)}`,
            );
        });

        test('should return `null` if no config file is found', async () => {
            const cwd = 'test/fixtures/config-finder/nothing';

            const result = await findNextRootConfig(cwd);

            if (result !== null) {
                if (isExternalPath(result.path)) {
                    // If the result is located outside of the project root directory,
                    // then it is safe to ignore it
                    return;
                }

                // If the result is located inside of the project root directory,
                // then it is an error
                throw new Error(`Unexpected config file found: ${result.path}`);
            }
        });

        test('should return the path to the first root config file found', async () => {
            const cwd = 'test/fixtures/config-finder/valid/subdir1/subdir2/subdir3';

            // should skip the first config file, because it is not a root config file
            await expect(findNextRootConfig(cwd)).resolves.toMatchObject({
                path: resolve(projectRoot, 'test/fixtures/config-finder/valid/subdir1/.aglintrc.yml'),
            });
        });

        test('should return the path to the first non-root config file if no root config file is found', async () => {
            const cwd = 'test/fixtures/config-finder/valid-no-root/subdir1/subdir2';

            // should return the first config file, because no root config files are
            // specified at upper levels
            const result = await findNextRootConfig(cwd);

            if (result === null) {
                throw new Error('No config file found');
            }

            // Handle expected path a bit tricky, because we may find a config file
            // that is located outside of the project root directory
            const expected = resolve(
                projectRoot,
                'test/fixtures/config-finder/valid-no-root/subdir1/subdir2/.aglintrc.yml',
            );

            if (result.path !== expected) {
                if (isExternalPath(result.path)) {
                    // If the result is located outside of the project root directory,
                    // then it is safe to ignore it
                    return;
                }

                // If the result is located inside of the project root directory,
                // then it is an error
                throw new Error(`Unexpected config file found: ${result.path}`);
            }
        });
    });
});
