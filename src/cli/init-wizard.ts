/* eslint-disable no-console */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import {
    basename,
    dirname,
    extname,
    join,
} from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    AdblockProduct,
    getHumanReadablePlatformName,
    getHumanReadableProductName,
    getProductSpecificPlatforms,
    PLATFORM_SEPARATOR,
    stringifyPlatforms,
} from '@adguard/agtree';
import checkbox, { Separator } from '@inquirer/checkbox';
import confirm from '@inquirer/confirm';
import select from '@inquirer/select';
import { inflect } from 'inflection';
import { stringify as yamlStringify } from 'yaml';

import { NEWLINE } from '../common/constants';
import { AGLINT_REPO_URL } from '../linter';
import { formatJson } from '../utils/format-json';

import {
    CONFIG_FILE_NAMES,
    EXT_JSON,
    JSON_CONFIG_FILE_NAME,
    JSON_RC_CONFIG_FILE_NAME,
    type LinterConfigFile,
    LinterConfigFileFormat,
    PACKAGE_JSON,
    PRESET_PREFIX,
    RC_CONFIG_FILE,
    YAML_CONFIG_FILE_NAME,
    YAML_RC_CONFIG_FILE_NAME,
    YML_CONFIG_FILE_NAME,
    YML_RC_CONFIG_FILE_NAME,
} from './config-file/config-file';
import { fileExists } from './utils/file-exists';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Linter CLI initialization wizard.
 */
export class LinterCliInitWizard {
    /**
     * URL to the configuration documentation.
     */
    private static readonly CONFIGURATION_URL = `${AGLINT_REPO_URL}/blob/master/docs/configuration.md`;

    /**
     * Path to the config presets directory.
     */
    private static readonly CONFIG_PRESETS_DIR = join(__dirname, '../../config-presets');

    /**
     * Name of the recommended preset.
     */
    private static readonly PRESET_RECOMMENDED = 'recommended';

    /**
     * Name of the all preset.
     */
    private static readonly PRESET_ALL = 'all';

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
                        throw new Error(`Config found in "aglint" property of "${join(cwd, configFileName)}"`);
                    }
                    // No "aglint" property, continue checking other config files
                } else {
                    throw new Error(`Config file "${join(cwd, configFileName)}" already exists`);
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
            { name: 'YAML', value: LinterConfigFileFormat.Yaml },
            { name: 'JSON', value: LinterConfigFileFormat.Json },
        ];

        // Only offer package.json option if it already exists
        const packageJsonPath = join(cwd, PACKAGE_JSON);
        if (await fileExists(packageJsonPath)) {
            choices.push({ name: 'package.json', value: LinterConfigFileFormat.PackageJson });
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
     * Discovers available presets from the config-presets directory.
     *
     * @returns List of available presets.
     */
    private static async discoverPresets(): Promise<Array<{ name: string; description?: string }>> {
        try {
            const files = await readdir(LinterCliInitWizard.CONFIG_PRESETS_DIR);
            const presets: Array<{ name: string; description?: string }> = [];

            for (const file of files) {
                const ext = extname(file);
                if (ext === EXT_JSON) {
                    const presetName = basename(file, ext);
                    let description: string | undefined;

                    // Add descriptions for known presets
                    if (presetName === LinterCliInitWizard.PRESET_RECOMMENDED) {
                        description = 'suitable for most projects';
                    } else if (presetName === LinterCliInitWizard.PRESET_ALL) {
                        description = 'includes all rules';
                    }

                    presets.push({ name: presetName, description });
                }
            }

            // Sort presets to have 'recommended' first, then 'all', then others alphabetically
            presets.sort((a, b) => {
                if (a.name === LinterCliInitWizard.PRESET_RECOMMENDED) {
                    return -1;
                }
                if (b.name === LinterCliInitWizard.PRESET_RECOMMENDED) {
                    return 1;
                }
                if (a.name === LinterCliInitWizard.PRESET_ALL) {
                    return -1;
                }
                if (b.name === LinterCliInitWizard.PRESET_ALL) {
                    return 1;
                }
                return a.name.localeCompare(b.name);
            });

            return presets;
        } catch {
            // Fallback to empty array if directory reading fails
            return [];
        }
    }

    /**
     * Prompts user to select adblock products.
     *
     * @returns Selected products.
     */
    private static async promptProducts(): Promise<AdblockProduct[]> {
        return checkbox({
            message: 'Select which adblock product(s) you want to support.\n',
            choices: [
                { name: getHumanReadableProductName(AdblockProduct.Abp), value: AdblockProduct.Abp },
                { name: getHumanReadableProductName(AdblockProduct.Adg), value: AdblockProduct.Adg },
                { name: getHumanReadableProductName(AdblockProduct.Ubo), value: AdblockProduct.Ubo },
            ],
        });
    }

    /**
     * Prompts user to select presets to extend.
     *
     * @returns Selected presets.
     */
    private static async promptPresets(): Promise<string[]> {
        const presets = await LinterCliInitWizard.discoverPresets();

        if (presets.length === 0) {
            // No presets available, return empty array
            return [];
        }

        const choices = presets.map((preset, index) => {
            const value = `${PRESET_PREFIX}${preset.name}`;
            const displayName = preset.description
                ? `${value} (${preset.description})`
                : value;

            return {
                value,
                name: displayName,
                // Check 'recommended' by default
                checked: preset.name === LinterCliInitWizard.PRESET_RECOMMENDED && index === 0,
            };
        });

        return checkbox({
            message: 'Select which preset(s) you want to extend (or none).\n',
            choices,
            validate: (selected) => {
                const values = selected.map((choice) => choice.value);
                const hasRecommended = values.includes(`${PRESET_PREFIX}${LinterCliInitWizard.PRESET_RECOMMENDED}`);
                const hasAll = values.includes(`${PRESET_PREFIX}${LinterCliInitWizard.PRESET_ALL}`);

                if (hasRecommended && hasAll) {
                    // eslint-disable-next-line max-len
                    return `Cannot select both "${PRESET_PREFIX}${LinterCliInitWizard.PRESET_RECOMMENDED}" and "${PRESET_PREFIX}${LinterCliInitWizard.PRESET_ALL}". Please choose one or none.`;
                }

                return true;
            },
        });
    }

    /**
     * Prompts user to specify if they want to set root option.
     *
     * @returns Whether to set root option.
     */
    private static async promptRootOption(): Promise<boolean> {
        const url = `${LinterCliInitWizard.CONFIGURATION_URL}#why-the-root-option-is-important`;
        return confirm({
            message:
                'Do you want to specify this config as root? '
                + '(recommended if this is the project root directory)\n'
                + `Learn more: ${url}\n`,
            default: true,
        });
    }

    /**
     * Prompts user to select platforms.
     *
     * @param products Selected products.
     *
     * @returns Selected platforms.
     */
    private static async promptPlatforms(products: AdblockProduct[]): Promise<string[]> {
        const specificPlatformsArray = await checkbox({
            // eslint-disable-next-line max-len
            message: `Select which platform(s) you want to support for the selected ${inflect('product', products.length)}.\n`,
            choices: products.flatMap((product) => {
                return [
                    new Separator(`--- ${getHumanReadableProductName(product)} ---`),
                    ...getProductSpecificPlatforms(product).map((platform) => {
                        const rawPlatform = getHumanReadablePlatformName(platform);
                        return {
                            name: rawPlatform,
                            value: platform,
                        };
                    }),
                ];
            }),
            required: true,
        });

        const platforms = specificPlatformsArray.reduce((acc, platform) => {
            return acc | platform;
        }, 0);

        return stringifyPlatforms(platforms).split(PLATFORM_SEPARATOR);
    }

    /**
     * Creates a content of the config file.
     *
     * @param chosenFormat Format chosen by the user.
     * @param chosenPresets Presets chosen by the user.
     * @param chosenPlatforms Platforms chosen by the user.
     * @param isRoot Whether to set root option.
     *
     * @returns Config file content.
     */
    private static getConfigFileContent(
        chosenFormat: LinterConfigFileFormat,
        chosenPresets: string[],
        chosenPlatforms: string[],
        isRoot: boolean,
    ): string {
        // Prepare config object
        const preparedConfig: LinterConfigFile = {};

        // Only add root if user chose to
        if (isRoot) {
            preparedConfig.root = true;
        }

        // Only add extends if user selected presets
        if (chosenPresets.length > 0) {
            preparedConfig.extends = chosenPresets;
        }

        // Only add platforms if user selected platforms
        if (chosenPlatforms.length > 0) {
            preparedConfig.platforms = chosenPlatforms;
        }

        // Serialize config object to a string based on the chosen format
        let serializedConfig: string;

        switch (chosenFormat) {
            case LinterConfigFileFormat.Yaml:
                // YAML supports comments, so we can add some useful info to the beginning of the file
                serializedConfig = [
                    '# AGLint config file',
                    `# Documentation: ${LinterCliInitWizard.CONFIGURATION_URL}`,
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
            console.log(`Config was added successfully to "${join(this.cwd, configFileName)}"`);
        } else {
            console.log(`Config file was created successfully at "${join(this.cwd, configFileName)}"`);
        }
    }

    /**
     * Runs the init wizard.
     */
    public async run(): Promise<void> {
        // Display welcome message
        console.log('Welcome to AGLint configuration wizard!');
        console.log(`This wizard will help you create a new AGLint config file in "${this.cwd}"\n`);

        // Check if config file already exists
        await LinterCliInitWizard.checkExistingConfig(this.cwd);

        // Ask user to specify which config file format to use
        const chosenFormat = await LinterCliInitWizard.promptFormat(this.cwd);

        // Ask user to specify which config file name to use
        const configFileName = await LinterCliInitWizard.promptConfigFileName(chosenFormat);

        // Ask user to specify which products to use
        const chosenProducts = await LinterCliInitWizard.promptProducts();

        let chosenPlatforms: string[] = [];

        if (chosenProducts.length > 0) {
            // Ask user to specify which platforms to use
            chosenPlatforms = await LinterCliInitWizard.promptPlatforms(chosenProducts);
        }

        // Ask user to select presets
        const chosenPresets = await LinterCliInitWizard.promptPresets();

        // Ask user if they want to set root option
        const isRoot = await LinterCliInitWizard.promptRootOption();

        // Generate config file content based on the chosen format and products
        const configContent = LinterCliInitWizard.getConfigFileContent(
            chosenFormat,
            chosenPresets,
            chosenPlatforms,
            isRoot,
        );

        // Write the config file to the current working directory
        await this.writeConfigFile(configFileName, configContent);

        // Notify the user that the config file was created successfully
        this.notifySuccess(configFileName);
    }
}
