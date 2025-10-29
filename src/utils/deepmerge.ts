import deepMergeLib, { type ArrayMergeOptions } from 'deepmerge';

const combineMerge = (target: any[], source: any[], options: ArrayMergeOptions) => {
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
