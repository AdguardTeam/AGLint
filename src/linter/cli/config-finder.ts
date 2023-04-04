import { readdir } from 'fs/promises';
import path from 'path';
import { CONFIG_FILE_NAMES } from './constants';

/**
 * Finds the root config file for the given working directory. If the working directory
 * itself does not contain a config file, it will search for a config file in the parent
 * directories, until it reaches the root directory.
 *
 * @param cwd The current working directory
 * @returns Promise with the path to the root config file or `null` if no config file was found
 */
export async function findRootConfig(cwd: string): Promise<string | null> {
    // Start with the current working directory
    let dir = path.resolve(cwd);

    // Keep searching for a config file until we reach the root directory
    do {
        // Get the list of files in the current directory
        const files = await readdir(dir);

        // Collect all config files in the current directory
        const configFiles = files.filter((file) => CONFIG_FILE_NAMES.includes(file));

        // If there is only one config file, return it
        if (configFiles.length === 1) {
            return path.join(dir, configFiles[0]);
        }

        // If there are multiple config files, throw an error
        if (configFiles.length > 1) {
            throw new Error(`Multiple config files found in ${dir}`);
        }

        // If there are no config files, go one directory up and try again
        dir = path.join(dir, '..');
    }
    while (dir !== path.resolve(dir, '..'));

    // If we reached this point, that means no config file was found,
    // so return null
    return null;
}
