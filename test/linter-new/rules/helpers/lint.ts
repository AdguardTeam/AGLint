import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type LinterRulesConfig } from '../../../../src/linter-new/config';
import { LinterFixer, type LinterFixerResult } from '../../../../src/linter-new/fixer';
import { Linter, type LinterResult } from '../../../../src/linter-new/linter';
import { type LinterRuleLoader } from '../../../../src/linter-new/rule-registry/rule-loader';

import { commonLinterConfig } from './common-linter-config';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

const ruleLoader: LinterRuleLoader = async (ruleName) => {
    return (await import(join(__dirname, `../../../../src/linter-new/rules/${ruleName}`))).default;
};

export const lint = (content: string, rulesConfig: LinterRulesConfig): Promise<LinterResult> => {
    return Linter.lint(
        {
            content,
        },
        {
            ...commonLinterConfig,
            rules: rulesConfig,
        },
        ruleLoader,
    );
};

export const lintWithFix = (content: string, rulesConfig: LinterRulesConfig): Promise<LinterFixerResult> => {
    return LinterFixer.lint(
        {
            content,
        },
        {
            ...commonLinterConfig,
            rules: rulesConfig,
        },
        ruleLoader,
    );
};
