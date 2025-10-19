import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type LinterRulesConfig, type LinterSubParsersConfig } from '../../../../src/linter-new/config';
import { LinterFixer, type LinterFixerResult } from '../../../../src/linter-new/fixer';
import { Linter, type LinterResult } from '../../../../src/linter-new/linter';
import { type LinterRuleLoader } from '../../../../src/linter-new/rule-registry/rule-loader';

import { commonLinterConfig, commonSubParsers } from './common-linter-config';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

const ruleLoader: LinterRuleLoader = async (ruleName) => {
    return (await import(join(__dirname, `../../../../src/rules/${ruleName}`))).default;
};

export const lint = (
    content: string,
    rulesConfig: LinterRulesConfig,
    subParsers?: LinterSubParsersConfig,
): Promise<LinterResult> => {
    return Linter.lint({
        fileProps: {
            content,
        },
        config: {
            ...commonLinterConfig,
            rules: rulesConfig,
        },
        loadRule: ruleLoader,
        subParsers: {
            ...commonSubParsers,
            ...subParsers,
        },
    });
};

export const lintWithFixes = (
    content: string,
    rulesConfig: LinterRulesConfig,
    subParsers?: LinterSubParsersConfig,
): Promise<LinterFixerResult> => {
    return LinterFixer.lintWithFixes({
        fileProps: {
            content,
        },
        config: {
            ...commonLinterConfig,
            rules: rulesConfig,
        },
        loadRule: ruleLoader,
        subParsers: {
            ...commonSubParsers,
            ...subParsers,
        },
    });
};
