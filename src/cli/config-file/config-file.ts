import * as v from 'valibot';

import { linterRulesConfigSchema, platformsSchema } from '../../linter/config';

export const CONFIG_FILE = 'aglint.config';
export const RC_CONFIG_FILE = '.aglintrc';

export const EXT_JSON = '.json';
export const EXT_YAML = '.yaml';
export const EXT_YML = '.yml';

export const JSON_CONFIG_FILE_NAME = `${CONFIG_FILE}${EXT_JSON}`;
export const YAML_CONFIG_FILE_NAME = `${CONFIG_FILE}${EXT_YAML}`;
export const YML_CONFIG_FILE_NAME = `${CONFIG_FILE}${EXT_YML}`;

export const JSON_RC_CONFIG_FILE_NAME = `${RC_CONFIG_FILE}${EXT_JSON}`;
export const YAML_RC_CONFIG_FILE_NAME = `${RC_CONFIG_FILE}${EXT_YAML}`;
export const YML_RC_CONFIG_FILE_NAME = `${RC_CONFIG_FILE}${EXT_YML}`;

export const PACKAGE_JSON = 'package.json';

/**
 * Preset prefix for built-in presets.
 */
export const PRESET_PREFIX = 'aglint:';

/**
 * Possible names of the config file.
 */
export const CONFIG_FILE_NAMES: ReadonlySet<string> = new Set([
    // aglint.config stuff
    JSON_CONFIG_FILE_NAME,
    YAML_CONFIG_FILE_NAME,
    YML_CONFIG_FILE_NAME,

    // .aglintrc stuff
    RC_CONFIG_FILE,
    JSON_RC_CONFIG_FILE_NAME,
    YAML_RC_CONFIG_FILE_NAME,
    YML_RC_CONFIG_FILE_NAME,

    // package.json
    PACKAGE_JSON,
]);

export enum LinterConfigFileFormat {
    Json = 'json',
    Yaml = 'yaml',
    PackageJson = 'package.json',
}

export const linterConfigFileSchema = v.pipe(
    v.object({
        root: v.pipe(
            v.optional(v.boolean(), false),
            v.description(
                'Indicates whether this configuration file is the root. When true, AGLint stops looking for '
                + 'configuration files in parent directories.',
            ),
        ),
        extends: v.pipe(
            v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
            v.description(
                'List of configuration files or presets to extend from. Configurations are merged with later '
                + 'entries overriding earlier ones. Presets can be referenced with the "aglint:" prefix.',
            ),
        ),
        platforms: v.pipe(
            v.optional(platformsSchema, []),
            v.description('Supported platforms'),
        ),
        rules: v.pipe(
            v.optional(linterRulesConfigSchema),
            v.description(
                'Rule configurations as key-value pairs where keys are rule names and values are severity '
                + 'levels or arrays with severity and options.',
            ),
        ),
    }),
    v.description('AGLint configuration file schema for aglint.config.json, .aglintrc.json, or package.json'),
);

export type LinterConfigFile = v.InferInput<typeof linterConfigFileSchema>;

export type LinterConfigFileParsed = v.InferOutput<typeof linterConfigFileSchema>;
