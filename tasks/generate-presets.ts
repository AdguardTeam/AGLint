/* eslint-disable no-await-in-loop */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fg from 'fast-glob';

import { type LinterConfigFile } from '../src/cli/config-file/config-file';
import {
    type LinterRule,
    type LinterRuleConfig,
    LinterRuleSeverity,
    LinterRuleType,
    severityToText,
} from '../src/linter/rule';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Override the default severity or configuration for specific rules in preset generation.
 *
 * **Default behavior (without overrides):**
 * - `Problem` type rules → severity: `"error"`.
 * - Other type rules → severity: `"warn"`.
 * - Rules with a config schema → `[severity, ...defaultConfig]`.
 * - Rules without config → just the severity string.
 *
 * **Examples:**
 * - `'rule-name': 'error'` - Override severity only (keeps default config if one exists).
 * - `'rule-name': ['warn', { option: true }]` - Override severity AND config.
 */
const RULE_OVERRIDES: Readonly<Record<string, LinterRuleConfig>> = {
    // TODO: Add overrides here
};

/**
 * Generates presets for rules.
 */
async function main() {
    const files = await fg([path.join(__dirname, '../src/rules/*.ts')]);

    const all: LinterConfigFile = {
        rules: {},
    };

    const recommended: LinterConfigFile = {
        rules: {},
    };

    for (const file of files) {
        const rule: LinterRule = (await import(file)).default;
        const severityEnum = rule.meta.type === LinterRuleType.Problem
            ? LinterRuleSeverity.Error
            : LinterRuleSeverity.Warning;
        const severity = severityToText(severityEnum);
        let ruleConfig: LinterRuleConfig;

        if (rule.meta.configSchema && rule.meta.defaultConfig) {
            ruleConfig = [severity, ...rule.meta.defaultConfig];
        } else {
            ruleConfig = severity;
        }

        let finalConfig: LinterRuleConfig = ruleConfig;
        const override = RULE_OVERRIDES[rule.meta.docs.name];
        if (override !== undefined) {
            if (typeof override === 'string') {
                if (rule.meta.configSchema && rule.meta.defaultConfig) {
                    finalConfig = [override, ...rule.meta.defaultConfig];
                } else {
                    finalConfig = override;
                }
            } else {
                finalConfig = override as LinterRuleConfig;
            }
        }

        if (rule.meta.docs.recommended) {
            recommended.rules![rule.meta.docs.name] = finalConfig;
        }

        all.rules![rule.meta.docs.name] = finalConfig;
    }

    await writeFile(path.join(__dirname, '../config-presets/all.json'), JSON.stringify(all, null, 2));
    await writeFile(path.join(__dirname, '../config-presets/recommended.json'), JSON.stringify(recommended, null, 2));
}

main();
