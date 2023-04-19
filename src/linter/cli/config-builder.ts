import cloneDeep from 'clone-deep';
import { LinterConfig } from '../common';
import { mergeConfigs } from '../config';
import { configFinder } from './config-finder';
import { parseConfigFile } from './config-reader';
import { NoConfigError } from './errors/no-config-error';

/**
 * Constructs a config object for the given directory by merging all config files
 * from the top to the bottom.
 *
 * @param dir Base directory
 * @returns Config object
 * @throws If no config file was found
 * @throws If a config file is found, but it is not valid
 * @throws If multiple config files are found in the same directory
 */
export async function buildConfigForDirectory(dir: string): Promise<LinterConfig> {
    const parsedConfigs: LinterConfig[] = [];

    // Finds config files from the actual directory to the root directory
    await configFinder(dir, async (path) => {
        const parsedConfig = await parseConfigFile(path);
        parsedConfigs.push(parsedConfig);

        // Abort the search if the config file is a root config file
        return parsedConfig.root === true;
    });

    // If no config file was found, throw an error
    if (parsedConfigs.length === 0) {
        throw new NoConfigError(dir);
    }

    // If there is only one config file, return it
    if (parsedConfigs.length === 1) {
        return parsedConfigs[0];
    }

    // Merge config files in reverse order
    // (reverse order = merge from the root directory to the actual directory)
    let mergedConfig = parsedConfigs[parsedConfigs.length - 1];

    for (let i = parsedConfigs.length - 2; i >= 0; i -= 1) {
        mergedConfig = mergeConfigs(mergedConfig, parsedConfigs[i]);
    }

    // Make sure that the config object is not mutated
    return cloneDeep(mergedConfig);
}
