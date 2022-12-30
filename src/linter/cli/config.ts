import { readFile } from "fs/promises";
import path from "path";
import * as ss from "superstruct";
import yaml from "js-yaml";
import merge from "deepmerge";

/**
 * CLI configuration interface (used for type safety)
 */
export interface LinterCliConfig {
    /**
     * Whether to use colors in the output
     */
    colors?: boolean;

    /**
     * Whether to fix linting errors automatically (if possible)
     */
    fix?: boolean;
}

/**
 * Superstruct schema for the config (used for validation)
 */
export const linterCliConfigSchema = ss.object({
    colors: ss.optional(ss.boolean()),
    fix: ss.optional(ss.boolean()),
});

/**
 * Default CLI configuration
 */
export const defaultLinterCliConfig: LinterCliConfig = {
    colors: true,
    fix: false,
};

/**
 * Reads and parses a configuration file.
 *
 * Currently supported config file extensions:
 * - .json
 * - .yaml / .yml
 *
 * @param filename - The name of the configuration file to be read and parsed.
 * @returns The parsed config object.
 * @throws If the file extension is not supported or if the config object fails validation.
 */
export async function parseConfigFile(filename: string): Promise<LinterCliConfig> {
    // Determine the file extension
    const extension = path.extname(filename);

    // Read the file contents
    const contents = await readFile(filename, "utf8");

    // At this point, we don't know exactly what the file contains, so simply mark
    // it as unknown, later we validate it anyway
    let parsed: unknown;

    // Parse the file contents based on the extension
    switch (extension) {
        case ".json": {
            // Built-in JSON parser
            parsed = JSON.parse(contents);
            break;
        }

        case ".yaml":
        case ".yml": {
            // Well-tested external YAML parser
            parsed = yaml.load(contents);
            break;
        }

        // TODO: .aglintrc, js/ts files
        default: {
            throw new Error(`Unsupported config file extension: ${extension}`);
        }
    }

    // Validate the parsed config object against the config schema using Superstruct
    ss.assert(parsed, linterCliConfigSchema);

    return parsed;
}

/**
 * Merges two configuration objects using deepmerge. Practically, this means that
 * the `extend` object will be merged into the `initial` object.
 *
 * @param initial The initial config object
 * @param extend The config object to extend the initial config with
 * @returns The merged config object
 * @example
 * If you have the following config (called `initial` parameter):
 * ```json
 * {
 *   "colors": true,
 *   "fix": false
 * }
 * ```
 * And you want to extend it with the following config (called `extend` parameter):
 * ```json
 * {
 *   "colors": false
 * }
 * ```
 * The result will be:
 * ```json
 * {
 *   "colors": false,
 *   "fix": false
 * }
 * ```
 */
export function mergeConfigs(initial: LinterCliConfig, extend: LinterCliConfig): LinterCliConfig {
    return merge(initial, extend);
}
