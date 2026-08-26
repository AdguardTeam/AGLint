import * as v from 'valibot';

/**
 * Schema for available reporter formats.
 */
export const reporterTypeSchema = v.picklist([
    'console',
    'json',
    'json-with-metadata',
]);

/**
 * Type representing available reporter formats.
 */
export type ReporterType = v.InferOutput<typeof reporterTypeSchema>;

/**
 * Array of reporter type values for CLI choices.
 */
export const REPORTER_TYPES = reporterTypeSchema.options;
