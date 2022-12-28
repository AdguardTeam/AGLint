import path, { ParsedPath } from "path";
import { ScannedDirectory } from "./scan";
import { LinterCliConfig, defaultLinterCliConfig, mergeConfigs, parseConfigFile } from "./config";
import cloneDeep from "clone-deep";

/**
 * An event that is performed on a file or directory.
 */
export type WalkEvent = (path: ParsedPath, config: LinterCliConfig) => Promise<void>;

/**
 * An object containing the events to be performed on each file and directory.
 */
interface WalkEvents {
    file: WalkEvent;
    dir?: WalkEvent;
}

/**
 * Walks a `ScannedDirectory` object and performs an action on each file and directory
 * in the tree.
 *
 * @param scannedDirectory The `ScannedDirectory` object to be walked
 * @param events The events to be performed on each file and directory
 * @param config The CLI config
 */
export async function walkScannedDirectory(
    scannedDirectory: ScannedDirectory,
    events: WalkEvents,
    config: LinterCliConfig = defaultLinterCliConfig
) {
    // Inherit the config from the parent directory
    let mergedConfig = config;

    // If the current directory has a config file, parse it and merge it with the parent config
    if (scannedDirectory.configFile) {
        mergedConfig = mergeConfigs(
            config,
            await parseConfigFile(path.join(scannedDirectory.configFile.dir, scannedDirectory.configFile.base))
        );
    }

    // Clone the merged config so that we can pass it to the file action
    // This is necessary to prevent unwanted side effects
    const mergedConfigDeepClone = cloneDeep(mergedConfig);

    // Perform the directory action on the current directory (if it exists)
    if (events.dir) {
        await events.dir(scannedDirectory.dir, mergedConfig);
    }

    // Perform the file action on each lintable file
    for (const file of scannedDirectory.lintableFiles) {
        await events.file(file, mergedConfigDeepClone);
    }

    // Recursively walk each subdirectory
    for (const subdir of scannedDirectory.subdirectories) {
        walkScannedDirectory(subdir, events, mergedConfigDeepClone);
    }
}
