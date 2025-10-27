import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type LinterRulesConfig, type LinterSubParsersConfig } from '../../../src/linter/config';
import { defaultSubParsers } from '../../../src/linter/default-subparsers';
import { type LinterFixerResult, lintWithFixes as lintWithFixesFn } from '../../../src/linter/fixer';
import { type LinterResult, lint as lintFn } from '../../../src/linter/linter';
import { type LinterRuleLoader } from '../../../src/linter/rule-registry/rule-loader';

import { commonLinterConfig } from './common-linter-config';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

const ruleLoader: LinterRuleLoader = async (ruleName) => {
    return (await import(join(__dirname, `../../../src/rules/${ruleName}`))).default;
};

export const lint = (
    content: string,
    rulesConfig: LinterRulesConfig,
    subParsers?: LinterSubParsersConfig,
): Promise<LinterResult> => {
    return lintFn({
        fileProps: {
            content,
        },
        config: {
            ...commonLinterConfig,
            rules: rulesConfig,
        },
        loadRule: ruleLoader,
        subParsers: {
            ...defaultSubParsers,
            ...subParsers,
        },
    });
};

export const lintWithFixes = (
    content: string,
    rulesConfig: LinterRulesConfig,
    subParsers?: LinterSubParsersConfig,
): Promise<LinterFixerResult> => {
    return lintWithFixesFn({
        fileProps: {
            content,
        },
        config: {
            ...commonLinterConfig,
            rules: rulesConfig,
        },
        loadRule: ruleLoader,
        subParsers: {
            ...defaultSubParsers,
            ...subParsers,
        },
    });
};
