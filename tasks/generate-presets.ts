/* eslint-disable no-await-in-loop */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { AdblockSyntax } from '@adguard/agtree';
import fg from 'fast-glob';

import { type LinterConfigFile } from '../src/cli/config-file/config-file';
import {
    type LinterRule,
    type LinterRuleConfig,
    LinterRuleSeverity,
    LinterRuleType,
} from '../src/linter/rule';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = new URL('.', import.meta.url).pathname;

/**
 * Generates presets for rules.
 */
async function main() {
    const files = await fg([path.join(__dirname, '../src/rules/*.ts')]);

    const all: LinterConfigFile = {
        syntax: [AdblockSyntax.Common],
        rules: {},
    };

    const recommended: LinterConfigFile = {
        syntax: [AdblockSyntax.Common],
        rules: {},
    };

    for (const file of files) {
        const rule: LinterRule = (await import(file)).default;
        const severity = rule.meta.type === LinterRuleType.Problem
            ? LinterRuleSeverity.Error
            : LinterRuleSeverity.Warning;
        let ruleConfig: LinterRuleConfig;

        if (rule.meta.configSchema && rule.meta.defaultConfig) {
            ruleConfig = [severity, ...rule.meta.defaultConfig];
        } else {
            ruleConfig = severity;
        }

        if (rule.meta.docs.recommended) {
            recommended.rules![rule.meta.docs.name] = ruleConfig;
        }

        all.rules![rule.meta.docs.name] = ruleConfig;
    }

    await writeFile(path.join(__dirname, '../config-presets/all.json'), JSON.stringify(all, null, 2));
    await writeFile(path.join(__dirname, '../config-presets/recommended.json'), JSON.stringify(recommended, null, 2));
}

main();
