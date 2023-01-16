import path, { ParsedPath } from "path";
import cloneDeep from "clone-deep";
import { ScannedDirectory } from "./scan";
import { parseConfigFile } from "./config-reader";
import { LinterConfig, defaultLinterConfig } from "../config";

/**
 * An event that is performed on a file or directory.
 *
 * @param path The path of the file or directory
 * @param config The active linter config
 * @param fix Fix fixable problems automatically
 */
export type WalkEvent = (path: ParsedPath, config: LinterConfig, fix: boolean) => Promise<void>;

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
 * @param fix Fix fixable problems automatically
 */
export async function walkScannedDirectory(
    scannedDirectory: ScannedDirectory,
    events: WalkEvents,
    config: LinterConfig = defaultLinterConfig,
    fix = false
) {
    const configDeepClone = cloneDeep(
        scannedDirectory.configFile
            ? await parseConfigFile(path.join(scannedDirectory.configFile.dir, scannedDirectory.configFile.base))
            : config
    );

    // Perform the directory action on the current directory (if it exists)
    if (events.dir) {
        await events.dir(scannedDirectory.dir, configDeepClone, fix);
    }

    // Perform the file action on each lintable file
    for (const file of scannedDirectory.lintableFiles) {
        await events.file(file, configDeepClone, fix);
    }

    // Recursively walk each subdirectory
    for (const subDir of scannedDirectory.subdirectories) {
        await walkScannedDirectory(subDir, events, configDeepClone, fix);
    }
}
