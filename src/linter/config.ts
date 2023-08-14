/**
 * Linter configuration
 */

import merge from 'deepmerge';
import {
    array,
    boolean,
    enums,
    object,
    optional,
    record,
    string,
} from 'superstruct';
import { AdblockSyntax } from '@adguard/agtree';

import { linterRuleConfigSchema } from './rule';
import { type LinterConfig } from './common';

/**
 * Superstruct schema for the linter rules config object
 */
export const linterRulesSchema = optional(record(string(), linterRuleConfigSchema));

/**
 * Superstruct schema for the linter config object properties. It is necessary to
 * separate this from the schema for the whole config object because we reuse it
 * in the CLI config object.
 */
export const linterConfigPropsSchema = {
    root: optional(boolean()),
    extends: optional(array(string())),
    allowInlineConfig: optional(boolean()),
    syntax: optional(array(enums([
        AdblockSyntax.Common,
        AdblockSyntax.Adg,
        AdblockSyntax.Ubo,
        AdblockSyntax.Abp,
    ]))),
    rules: linterRulesSchema,
};

/**
 * Superstruct schema for the linter rule config (used for validation)
 */
export const linterConfigSchema = object(linterConfigPropsSchema);

/**
 * Default linter configuration
 */
export const defaultLinterConfig: LinterConfig = {
    allowInlineConfig: true,
    syntax: [AdblockSyntax.Common],
};

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
export function mergeConfigs(initial: LinterConfig, extend: Partial<LinterConfig>): LinterConfig {
    return merge(initial, extend, {
        // https://github.com/TehShrike/deepmerge#options
        arrayMerge: (_, sourceArray) => sourceArray,
    });
}
