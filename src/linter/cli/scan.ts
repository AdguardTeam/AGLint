import { readFile, readdir, stat } from "fs/promises";
import path, { ParsedPath } from "path";
import ignore, { Ignore } from "ignore";
import { CONFIG_FILE_NAMES, IGNORE_FILE_NAME, SUPPORTED_EXTENSIONS } from "./constants";

/**
 * Default ignores in order to avoid scanning node_modules, etc.
 */
const defaultIgnores = ignore().add("node_modules");

/**
 * Represents the result of a scan
 */
export interface ScannedDirectory {
    /**
     * Data about the current directory
     */
    dir: ParsedPath;

    /**
     * Only one config file is allowed in a directory, it may be null if no config file is found in
     * the directory
     */
    configFile: ParsedPath | null;

    /**
     * Lintable files in the directory (if any)
     */
    lintableFiles: ParsedPath[];

    /**
     * Subdirectories in the directory (if any)
     */
    subdirectories: ScannedDirectory[];
}

/**
 * Searches for lintable files in a directory recursively. Practically it means files with the
 * supported extensions. It will also search for config files.
 *
 * It will ignore files and directories that are ignored by the ignore file at any level.
 * `.aglintignore` works exactly like `.gitignore`.
 *
 * @param dir Directory to search in
 * @param ignores File ignores
 * @returns Array of file paths
 * @throws If multiple config files are found in the given directory
 */
export async function scan(dir: string, ignores: Ignore[] = [defaultIgnores]): Promise<ScannedDirectory> {
    // Initialize an empty result
    const result: ScannedDirectory = {
        dir: path.parse(dir),
        configFile: null,
        lintableFiles: [],
        subdirectories: [],
    };

    // Get all files in the directory
    const items = await readdir(dir);

    // First of all, let's parse the ignore file in the current directory (if it exists)
    if (items.includes(IGNORE_FILE_NAME)) {
        const content = await readFile(path.join(dir, IGNORE_FILE_NAME), "utf8");
        ignores.push(ignore().add(content));
    }

    // Loop through all items in the directory
    for (const item of items) {
        // If the current item is ignored, skip it
        if (ignores.some((i) => i.ignores(item))) {
            continue;
        }

        // Get the full path of the current item within the directory structure,
        // then get the stats of the item
        const itemPath = path.join(dir, item);
        const stats = await stat(itemPath);

        if (stats.isFile()) {
            // Parse path
            const parsedPath = path.parse(itemPath);

            // If the file is a config file
            if (CONFIG_FILE_NAMES.includes(item)) {
                // If a config file is already found, throw an error
                if (result.configFile !== null) {
                    throw new Error(
                        `Multiple config files found in the same directory: "${path.join(
                            result.configFile.dir,
                            result.configFile.base
                        )}" and "${itemPath}"`
                    );
                }

                // Otherwise, set the config file for the current directory
                result.configFile = parsedPath;
            }

            // We only want to lint files with the supported extensions
            else if (SUPPORTED_EXTENSIONS.includes(parsedPath.ext)) {
                result.lintableFiles.push(parsedPath);
            }
        }

        // If the current item is a directory, recursively scan it
        else if (stats.isDirectory()) {
            // Merge the subdirectory result into the current result
            result.subdirectories.push(await scan(itemPath, ignores));
        }
    }

    return result;
}
