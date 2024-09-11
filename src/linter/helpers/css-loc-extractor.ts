import { mask, number, object } from 'superstruct';

/**
 * Minimal schema for location object.
 */
const locSchema = object({
    start: object({
        offset: number(),
    }),
    end: object({
        offset: number(),
    }),
});

/**
 * Schema for object with `loc` property.
 */
const objWithLocSchema = object({
    loc: locSchema,
});

/**
 * Get start and end offsets from the object with `loc` property.
 *
 * @param input Object with `loc` property.
 *
 * @returns Tuple with start and end offsets or `null` if the object does not have `loc` property.
 */
export const getCssTreeStartAndEndOffsetsFromObject = (input: object): [number, number] | null => {
    try {
        const { loc } = mask(input, objWithLocSchema);
        return [loc.start.offset, loc.end.offset];
    } catch {
        return null;
    }
};
