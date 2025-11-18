import * as v from 'valibot';

import { linterRulesConfigSchema, syntaxArraySchema } from '../../linter/config';

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

export const linterConfigFileSchema = v.object({
    root: v.optional(v.boolean(), false),
    extends: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
    syntax: v.optional(syntaxArraySchema),
    rules: v.optional(linterRulesConfigSchema),
});

export type LinterConfigFile = v.InferInput<typeof linterConfigFileSchema>;

export type LinterConfigFileParsed = v.InferOutput<typeof linterConfigFileSchema>;
