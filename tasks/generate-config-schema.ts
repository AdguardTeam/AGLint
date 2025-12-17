/* eslint-disable no-console */
/**
 * @file Generate JSON schema for AGLint configuration files.
 *
 * This script generates a JSON Schema from the Valibot schema defined in
 * src/cli/config-file/config-file.ts and saves it to the schema folder.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toJsonSchema } from '@valibot/to-json-schema';

import { linterConfigFileSchema } from '../src/cli/config-file/config-file.js';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPPER_LEVEL = '../';
const SCHEMA_FOLDER_NAME = 'schema';
const OUTPUT_FILE_NAME = 'aglint-config.schema.json';

// Computed constants
const schemaFolderLocation = path.join(__dirname, UPPER_LEVEL, SCHEMA_FOLDER_NAME);
const outputFileLocation = path.join(schemaFolderLocation, OUTPUT_FILE_NAME);

/**
 * Main function to generate the JSON schema.
 */
const main = async (): Promise<void> => {
    try {
        // Generate JSON Schema from Valibot schema
        const jsonSchema = toJsonSchema(linterConfigFileSchema);

        // Add additional metadata
        const enrichedSchema = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            $id: 'https://github.com/AdguardTeam/AGLint/schema/aglint-config.schema.json',
            title: 'AGLint Configuration',
            description: 'Configuration schema for AGLint - the linter for AdBlock filter lists',
            ...jsonSchema,
        };

        // Create the schema folder if it doesn't exist
        await mkdir(schemaFolderLocation, { recursive: true });

        // Write the JSON schema to file
        await writeFile(
            outputFileLocation,
            JSON.stringify(enrichedSchema, null, 2),
            'utf-8',
        );

        console.log(`✓ Successfully generated JSON schema at ${outputFileLocation}`);
    } catch (error) {
        console.error('✗ Failed to generate JSON schema:', error);
        throw error;
    }
};

main();
