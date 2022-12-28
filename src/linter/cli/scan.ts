import { readFile, readdir, stat } from "fs/promises";
import ignore, { Ignore } from "ignore";
import path from "path";
import { CONFIG_FILE_NAMES, IGNORE_FILE_NAME, SUPPORTED_EXTENSIONS } from "./constants";

/**
 * Represents the result of a scan
 */
export interface ScanResult {
    /**
     * Array of config file paths (if any)
     */
    configFiles: string[];

    /**
     * Array of lintable file paths (if any)
     */
    lintableFiles: string[];
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
 */
export async function scan(dir: string, ignores: Ignore[] = []): Promise<ScanResult> {
    const result: ScanResult = {
        configFiles: [],
        lintableFiles: [],
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
            // If the file is a config file
            if (CONFIG_FILE_NAMES.includes(item)) {
                result.configFiles.push(itemPath);
            }

            // We only want to lint txt files (filter lists)
            else if (SUPPORTED_EXTENSIONS.includes(path.parse(item).ext)) {
                result.lintableFiles.push(itemPath);
            }
        }

        // If the current item is a directory, recursively scan it
        else if (stats.isDirectory()) {
            const subResult = await scan(itemPath, ignores);

            // Merge the results
            result.lintableFiles.push(...subResult.lintableFiles);
            result.configFiles.push(...subResult.configFiles);
        }
    }

    return result;
}
