import path, { ParsedPath } from "path";
import cloneDeep from "clone-deep";
import { ScannedDirectory } from "./scan";
import { LinterCliConfig, defaultLinterCliConfig, parseConfigFile } from "./config";

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
    const configDeepClone = cloneDeep(
        scannedDirectory.configFile
            ? await parseConfigFile(path.join(scannedDirectory.configFile.dir, scannedDirectory.configFile.base))
            : config
    );

    // Perform the directory action on the current directory (if it exists)
    if (events.dir) {
        await events.dir(scannedDirectory.dir, configDeepClone);
    }

    // Perform the file action on each lintable file
    for (const file of scannedDirectory.lintableFiles) {
        await events.file(file, configDeepClone);
    }

    // Recursively walk each subdirectory
    for (const subDir of scannedDirectory.subdirectories) {
        await walkScannedDirectory(subDir, events, configDeepClone);
    }
}
