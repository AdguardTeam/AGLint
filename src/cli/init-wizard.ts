import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AdblockSyntax } from '@adguard/agtree';
import checkbox from '@inquirer/checkbox';
import select from '@inquirer/select';
import { stringify as yamlStringify } from 'yaml';

import { NEWLINE } from '../common/constants';

import {
    CONFIG_FILE_NAMES,
    JSON_RC_CONFIG_FILE_NAME,
    type LinterConfigFile,
    LinterConfigFileFormat,
    YAML_RC_CONFIG_FILE_NAME,
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
                throw new Error(`Config file "${configFileName}" already exists in "${cwd}"`);
            }
        }
    }

    /**
     * Prompts user to select a config file format.
     *
     * @returns Selected format.
     */
    private static async promptFormat(): Promise<LinterConfigFileFormat> {
        return select({
            message: 'Select which config file format you want to use.\n',
            choices: [
                { value: LinterConfigFileFormat.Yaml },
                { value: LinterConfigFileFormat.Json },
            ],
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

            default:
                throw new Error(`Unsupported config file format "${chosenFormat}"`);
        }

        return serializedConfig;
    }

    /**
     * Gets the config file name based on the chosen format.
     *
     * @param chosenFormat Format chosen by the user.
     *
     * @returns Config file name.
     */
    private static getConfigFileName(chosenFormat: LinterConfigFileFormat): string {
        switch (chosenFormat) {
            case LinterConfigFileFormat.Yaml:
                return YAML_RC_CONFIG_FILE_NAME;

            case LinterConfigFileFormat.Json:
                return JSON_RC_CONFIG_FILE_NAME;

            default:
                throw new Error(`Unsupported config file format "${chosenFormat}"`);
        }
    }

    /**
     * Writes the config file to the current working directory.
     *
     * @param configFileName Config file name.
     * @param configContent Config file content.
     */
    private async writeConfigFile(configFileName: string, configContent: string): Promise<void> {
        await writeFile(join(this.cwd, configFileName), configContent);
    }

    /**
     * Notifies the user about the successful config file creation.
     *
     * @param configFileName Config file name.
     */
    private notifySuccess(configFileName: string): void {
        // eslint-disable-next-line no-console
        console.log(`Config file was created successfully in directory "${this.cwd}" as "${configFileName}"`);

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
        const chosenFormat = await LinterCliInitWizard.promptFormat();

        // Ask user to specify which syntaxes to use
        const chosenSyntaxes = await LinterCliInitWizard.promptSyntaxes();

        // Generate config file content based on the chosen format and syntaxes
        const configContent = LinterCliInitWizard.getConfigFileContent(chosenFormat, chosenSyntaxes);

        // Determine the config file name based on the chosen format
        const configFileName = LinterCliInitWizard.getConfigFileName(chosenFormat);

        // Write the config file to the current working directory
        await this.writeConfigFile(configFileName, configContent);

        // Notify the user that the config file was created successfully
        this.notifySuccess(configFileName);
    }
}
