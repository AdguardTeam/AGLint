import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AdblockSyntax } from '@adguard/agtree';
import checkbox from '@inquirer/checkbox';
import select from '@inquirer/select';
import { stringify as yamlStringify } from 'yaml';

import { NEWLINE } from '../common/constants';
import { formatJson } from '../utils/format-json';

import {
    CONFIG_FILE_NAMES,
    JSON_CONFIG_FILE_NAME,
    JSON_RC_CONFIG_FILE_NAME,
    type LinterConfigFile,
    LinterConfigFileFormat,
    PACKAGE_JSON,
    RC_CONFIG_FILE,
    YAML_CONFIG_FILE_NAME,
    YAML_RC_CONFIG_FILE_NAME,
    YML_CONFIG_FILE_NAME,
    YML_RC_CONFIG_FILE_NAME,
} from './config-file/config-file';
import { fileExists } from './utils/file-exists';

/**
 * Linter CLI initialization wizard.
 */
export class LinterCliInitWizard {
    /**
     * Current working directory.
     */
    private cwd: string;

    /**
     * Creates a new instance of the init wizard.
     *
     * @param cwd Current working directory.
     */
    constructor(cwd: string) {
        this.cwd = cwd;
    }

    /**
     * Checks if a config file already exists in the current directory.
     *
     * @param cwd Current working directory.
     *
     * @throws Error if a config file already exists.
     */
    private static async checkExistingConfig(cwd: string): Promise<void> {
        for (const configFileName of CONFIG_FILE_NAMES) {
            const configPath = join(cwd, configFileName);
            // eslint-disable-next-line no-await-in-loop
            if (await fileExists(configPath)) {
                // For package.json, check if it has an "aglint" property
                if (configFileName === PACKAGE_JSON) {
                    // Try to read and parse package.json
                    let parsed;
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        const content = await readFile(configPath, 'utf-8');
                        parsed = JSON.parse(content);
                    } catch {
                        // Can't read or parse package.json, skip it
                        continue;
                    }

                    // Successfully parsed - check for aglint property
                    if (parsed.aglint) {
                        throw new Error(`Config found in "aglint" property of "${configFileName}" in "${cwd}"`);
                    }
                    // No "aglint" property, continue checking other config files
                } else {
                    throw new Error(`Config file "${configFileName}" already exists in "${cwd}"`);
                }
            }
        }
    }

    /**
     * Prompts user to select a config file format.
     *
     * @param cwd Current working directory.
     *
     * @returns Selected format.
     */
    private static async promptFormat(cwd: string): Promise<LinterConfigFileFormat> {
        const choices = [
            { value: LinterConfigFileFormat.Yaml },
            { value: LinterConfigFileFormat.Json },
        ];

        // Only offer package.json option if it already exists
        const packageJsonPath = join(cwd, PACKAGE_JSON);
        if (await fileExists(packageJsonPath)) {
            choices.push({ value: LinterConfigFileFormat.PackageJson });
        }

        return select({
            message: 'Select which config file format you want to use.\n',
            choices,
        });
    }

    /**
     * Prompts user to select a config file name.
     *
     * @param format The selected format.
     *
     * @returns Selected config file name.
     */
    private static async promptConfigFileName(format: LinterConfigFileFormat): Promise<string> {
        const choices: Array<{ value: string; name?: string }> = [];

        switch (format) {
            case LinterConfigFileFormat.Json:
                choices.push(
                    { value: JSON_RC_CONFIG_FILE_NAME, name: `${JSON_RC_CONFIG_FILE_NAME} (recommended)` },
                    { value: JSON_CONFIG_FILE_NAME, name: JSON_CONFIG_FILE_NAME },
                    { value: RC_CONFIG_FILE, name: RC_CONFIG_FILE },
                );
                break;

            case LinterConfigFileFormat.Yaml:
                choices.push(
                    { value: YAML_RC_CONFIG_FILE_NAME, name: `${YAML_RC_CONFIG_FILE_NAME} (recommended)` },
                    { value: YML_RC_CONFIG_FILE_NAME, name: YML_RC_CONFIG_FILE_NAME },
                    { value: YAML_CONFIG_FILE_NAME, name: YAML_CONFIG_FILE_NAME },
                    { value: YML_CONFIG_FILE_NAME, name: YML_CONFIG_FILE_NAME },
                );
                break;

            case LinterConfigFileFormat.PackageJson:
                // No choice needed for package.json
                return PACKAGE_JSON;

            default:
                throw new Error(`Unsupported config file format "${format}"`);
        }

        return select({
            message: 'Select which config file name you want to use.\n',
            choices,
        });
    }

    /**
     * Prompts user to select adblock syntaxes.
     *
     * @returns Selected syntaxes.
     */
    private static async promptSyntaxes(): Promise<AdblockSyntax[]> {
        return checkbox({
            message: 'Select which adblock syntax(es) you want to use.\n"Common" is to be used if none is chosen.\n',
            choices: [
                { value: AdblockSyntax.Abp },
                { value: AdblockSyntax.Adg },
                { value: AdblockSyntax.Ubo },
            ],
        });
    }

    /**
     * Creates a content of the config file.
     *
     * @param chosenFormat Format chosen by the user.
     * @param chosenSyntaxes Syntaxes chosen by the user.
     *
     * @returns Config file content.
     */
    private static getConfigFileContent(chosenFormat: LinterConfigFileFormat, chosenSyntaxes: AdblockSyntax[]): string {
        // Prepare config object
        const preparedConfig: LinterConfigFile = {
            root: true,
            extends: [
                'aglint:recommended',
            ],
            // set Common syntax as default if nothing is chosen
            syntax: chosenSyntaxes.length === 0 ? [AdblockSyntax.Common] : chosenSyntaxes,
        };

        // Serialize config object to a string based on the chosen format
        let serializedConfig: string;

        switch (chosenFormat) {
            case LinterConfigFileFormat.Yaml:
                // YAML supports comments, so we can add some useful info to the beginning of the file
                serializedConfig = [
                    '# AGLint config file',
                    '# Documentation: https://github.com/AdguardTeam/AGLint#configuration',
                ].join(NEWLINE);
                serializedConfig += NEWLINE;
                // Serialize config object to YAML. This will add the final newline automatically
                serializedConfig += yamlStringify(preparedConfig);
                break;

            case LinterConfigFileFormat.Json:
                // Serialize config object to JSON
                serializedConfig = JSON.stringify(preparedConfig, null, 2);
                // Add final newline manually
                serializedConfig += NEWLINE;
                break;

            case LinterConfigFileFormat.PackageJson:
                // For package.json, we only return the config object (not serialized)
                // It will be merged with existing package.json in writeConfigFile
                serializedConfig = JSON.stringify(preparedConfig, null, 2);
                serializedConfig += NEWLINE;
                break;

            default:
                throw new Error(`Unsupported config file format "${chosenFormat}"`);
        }

        return serializedConfig;
    }

    /**
     * Writes the config file to the current working directory.
     *
     * @param configFileName Config file name.
     * @param configContent Config file content.
     */
    private async writeConfigFile(configFileName: string, configContent: string): Promise<void> {
        const filePath = join(this.cwd, configFileName);

        // Special handling for package.json - merge with existing file
        if (configFileName === PACKAGE_JSON) {
            // Read existing package.json (we know it exists because we only offer this option when it does)
            const originalRawPkg = await readFile(filePath, 'utf-8');
            const pkg = JSON.parse(originalRawPkg);

            // Add aglint property with the config
            pkg.aglint = JSON.parse(configContent);

            // Preserve original formatting: indent, newline style, and final newline
            const updatedRawPkg = formatJson(pkg, originalRawPkg);
            await writeFile(filePath, updatedRawPkg);
        } else {
            // For other formats, just write directly
            await writeFile(filePath, configContent);
        }
    }

    /**
     * Notifies the user about the successful config file creation.
     *
     * @param configFileName Config file name.
     */
    private notifySuccess(configFileName: string): void {
        if (configFileName === PACKAGE_JSON) {
            // eslint-disable-next-line no-console
            console.log(`Config was added successfully to "${configFileName}" in directory "${this.cwd}"`);
        } else {
            // eslint-disable-next-line no-console
            console.log(`Config file was created successfully in directory "${this.cwd}" as "${configFileName}"`);
        }

        // Notify user about root: true option
        // eslint-disable-next-line no-console, max-len
        console.log('Note: "root: true" option was added to the config file. Please make sure that the config file is located in the root directory of your project.');
        // eslint-disable-next-line no-console
        console.log('You can learn more at https://github.com/AdguardTeam/AGLint#why-the-root-option-is-important');
    }

    /**
     * Runs the init wizard.
     */
    public async run(): Promise<void> {
        // Check if config file already exists
        await LinterCliInitWizard.checkExistingConfig(this.cwd);

        // Ask user to specify which config file format to use
        const chosenFormat = await LinterCliInitWizard.promptFormat(this.cwd);

        // Ask user to specify which config file name to use
        const configFileName = await LinterCliInitWizard.promptConfigFileName(chosenFormat);

        // Ask user to specify which syntaxes to use
        const chosenSyntaxes = await LinterCliInitWizard.promptSyntaxes();

        // Generate config file content based on the chosen format and syntaxes
        const configContent = LinterCliInitWizard.getConfigFileContent(chosenFormat, chosenSyntaxes);

        // Write the config file to the current working directory
        await this.writeConfigFile(configFileName, configContent);

        // Notify the user that the config file was created successfully
        this.notifySuccess(configFileName);
    }
}
