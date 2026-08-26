import deepMergeLib, { type ArrayMergeOptions } from 'deepmerge';

/**
 * Checks if an array looks like a rule configuration tuple.
 * Rule configs start with a number (severity: 0, 1, 2 or string 'off', 'warn', 'error')
 * followed by optional configuration objects/values.
 *
 * @param arr The array to check.
 *
 * @returns True if the array appears to be a rule config.
 */
const isRuleConfig = (arr: any[]): boolean => {
    if (arr.length === 0) {
        return false;
    }
    const first = arr[0];
    return typeof first === 'number' || first === 'off' || first === 'warn' || first === 'error';
};

/**
 * Merges two rule configuration arrays.
 * Takes the severity from source but deep merges the configuration options.
 *
 * @param target The target rule config array.
 * @param source The source rule config array.
 *
 * @returns Merged rule config with source severity and merged options.
 */
const mergeRuleConfigs = (target: any[], source: any[]): any[] => {
    // Always use the source severity (first element)
    const result = [source[0]];

    // If there are config options, merge them
    if (target.length > 1 || source.length > 1) {
        // Collect all config objects from both arrays (skip first element which is severity)
        const targetConfigs = target.slice(1);
        const sourceConfigs = source.slice(1);

        // Deep merge all config objects
        if (targetConfigs.length > 0 || sourceConfigs.length > 0) {
            let mergedConfig = {};

            // Merge all target configs first
            for (const config of targetConfigs) {
                if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
                    mergedConfig = deepMergeLib(mergedConfig, config);
                } else {
                    // Non-object configs are just taken as-is
                    mergedConfig = config;
                }
            }

            // Then merge all source configs (which override target)
            for (const config of sourceConfigs) {
                if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
                    mergedConfig = deepMergeLib(mergedConfig, config);
                } else {
                    // Non-object configs replace
                    mergedConfig = config;
                }
            }

            result.push(mergedConfig);
        }
    }

    return result;
};

const combineMerge = (target: any[], source: any[], options: ArrayMergeOptions) => {
    // Special handling for rule configurations
    // Rule configs are tuples like [severity, ...options] where severity is a number or string
    if (isRuleConfig(target) && isRuleConfig(source)) {
        // Merge rule configs: use source severity but merge options
        return mergeRuleConfigs(target, source);
    }

    // Default behavior for other arrays (like platforms arrays, extends arrays, etc.)
    const destination = target.slice();

    source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
            destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
        } else if (options.isMergeableObject(item)) {
            destination[index] = deepMergeLib(target[index], item, options);
        } else if (target.indexOf(item) === -1) {
            destination.push(item);
        }
    });
    return destination;
};

export function deepMerge<T>(a: Partial<T>, b: Partial<T>): T;
export function deepMerge<T1, T2>(a: Partial<T1>, b: Partial<T2>): T1 & T2;

/**
 * Deep merges two objects.
 *
 * @param a The first object.
 * @param b The second object.
 *
 * @returns The merged object.
 */
export function deepMerge(a: any, b: any): any {
    return deepMergeLib(a, b, { arrayMerge: combineMerge });
}
