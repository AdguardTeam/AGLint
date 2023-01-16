import { readFile } from "fs/promises";
import { assert } from "superstruct";
import path from "path";
import yaml from "js-yaml";
import { LinterConfig, linterConfigSchema } from "../config";

/**
 * Reads and parses supported configuration files.
 *
 * @param filename - The name of the configuration file to be read and parsed.
 * @returns The parsed config object.
 * @throws If the file extension is not supported or if the config object fails validation.
 */
export async function parseConfigFile(filename: string): Promise<LinterConfig> {
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
    assert(parsed, linterConfigSchema);

    return parsed;
}
