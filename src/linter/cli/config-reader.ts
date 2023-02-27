import { readFile } from 'fs/promises';
import { assert, StructError } from 'superstruct';
import { parse } from 'path';
import yaml from 'js-yaml';
import { LinterConfig, linterConfigSchema } from '../config';
import { EMPTY } from '../../utils/constants';
import {
    EXT_JSON, EXT_YAML, EXT_YML, RC_CONFIG_FILE,
} from './constants';

/**
 * Reads and parses supported configuration files.
 *
 * @param filePath - The name of the configuration file to be read and parsed.
 * @returns The parsed config object.
 * @throws If the file not found or the file extension is not supported.
 * @throws If the file contents are not valid JSON or YAML.
 * @throws If the file contents are not valid according to the config schema.
 */
export async function parseConfigFile(filePath: string): Promise<LinterConfig> {
    try {
        // Determine the file extension
        const parsedFilePath = parse(filePath);

        // Read the file contents
        const contents = await readFile(filePath, 'utf8');

        // At this point, we don't know exactly what the file contains, so simply mark
        // it as unknown, later we validate it anyway
        let parsed: unknown;

        if (parsedFilePath.base === RC_CONFIG_FILE) {
            parsed = JSON.parse(contents);
        } else {
            // Parse the file contents based on the extension
            switch (parsedFilePath.ext) {
                case EXT_JSON: {
                    // Built-in JSON parser
                    parsed = JSON.parse(contents);
                    break;
                }

                case EXT_YAML:
                case EXT_YML: {
                    // Well-tested external YAML parser
                    parsed = yaml.load(contents);
                    break;
                }

                // TODO: Implement support for JS/TS config files
                default: {
                    throw new Error(`Unsupported config file extension "${parsedFilePath.ext}"`);
                }
            }
        }

        // Validate the parsed config object against the config schema using Superstruct
        assert(parsed, linterConfigSchema);

        return parsed;
    } catch (error: unknown) {
        if (error instanceof Error) {
            // Handle Superstruct errors
            if (error instanceof StructError) {
                // We can customize the error message here to make it more user-friendly
                // https://docs.superstructjs.org/guides/05-handling-errors#customizing-errors
                const { key, value, type } = error;

                let message = EMPTY;

                if (value === undefined) {
                    message = `"${key}" is required, but it was not provided`;
                } else if (type === 'never') {
                    message = `"${key}" is unknown in the config schema, please remove it`;
                } else {
                    message = `Value "${value}" for "${key}" is not a valid "${type}" type`;
                }

                throw new Error(`Failed to parse config file "${filePath}": ${message}`);
            }

            throw new Error(`Failed to parse config file "${filePath}": ${error.message}`);
        }

        // Pass through any other errors
        throw error;
    }
}
