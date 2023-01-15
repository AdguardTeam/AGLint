import { readFile } from "fs/promises";
import { assert, boolean, object, optional } from "superstruct";
import path from "path";
import yaml from "js-yaml";
import merge from "deepmerge";
import { LinterConfig, defaultLinterConfig, linterConfigPropsSchema } from "../config";

/**
 * CLI configuration interface, extends the core linter configuration
 */
export interface LinterCliConfig extends LinterConfig {
    /**
     * Whether to fix linting errors automatically (if possible)
     * When enabled, the linter will OVERWRITE the original file
     * with the fixed version.
     */
    fix?: boolean;

    /**
     * Keep `.aglintignore` ignore files into account when linting
     */
    ignores?: boolean;
}

/**
 * Superstruct schema for the config (used for validation)
 */
export const linterCliConfigSchema = object({
    fix: optional(boolean()),
    ignores: optional(boolean()),

    // Reuse the schema for the linter config object properties
    ...linterConfigPropsSchema,
});

/**
 * Default CLI configuration
 */
export const defaultLinterCliConfig: LinterCliConfig = {
    fix: false,
    ignores: true,

    // Reuse the default linter config
    ...defaultLinterConfig,
};

/**
 * Reads and parses supported configuration files.
 *
 * @param filename - The name of the configuration file to be read and parsed.
 * @returns The parsed config object.
 * @throws If the file extension is not supported or if the config object fails validation.
 */
export async function parseConfigFile(filename: string): Promise<LinterCliConfig> {
    // Determine the file extension
    const filePath = path.parse(filename);

    // Read the file contents
    const contents = await readFile(filename, "utf8");

    // At this point, we don't know exactly what the file contains, so simply mark
    // it as unknown, later we validate it anyway
    let parsed: unknown;

    if (filePath.base === ".aglintrc") {
        parsed = JSON.parse(contents);
    } else {
        // Parse the file contents based on the extension
        switch (filePath.ext) {
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

            // TODO: Implement support for JS/TS config files
            default: {
                throw new Error(`Unsupported config file extension: ${filePath.ext}`);
            }
        }
    }

    // Validate the parsed config object against the config schema using Superstruct
    assert(parsed, linterCliConfigSchema);

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
 *   "ignores": true,
 *   "fix": false
 * }
 * ```
 * And you want to extend it with the following config (called `extend` parameter):
 * ```json
 * {
 *   "ignores": false
 * }
 * ```
 * The result will be:
 * ```json
 * {
 *   "ignores": false,
 *   "fix": false
 * }
 * ```
 */
export function mergeConfigs(initial: LinterCliConfig, extend: LinterCliConfig): LinterCliConfig {
    return merge(initial, extend);
}
