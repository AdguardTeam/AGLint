import { type LinterConfig } from '../../../src/linter/config';

export const commonLinterConfig: Omit<LinterConfig, 'rules'> = {
    platforms: [],
    allowInlineConfig: true,
    reportUnusedDisableDirectives: false,
    unusedDisableDirectivesSeverity: 'warn',
};
