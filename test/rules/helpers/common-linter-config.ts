import { AdblockSyntax } from '@adguard/agtree/utils';

import { type LinterConfigParsed } from '../../../src/linter/config';

export const commonLinterConfig: Omit<LinterConfigParsed, 'rules'> = {
    syntax: [
        AdblockSyntax.Adg,
    ],
    allowInlineConfig: true,
    reportUnusedDisableDirectives: false,
    unusedDisableDirectivesSeverity: 'warn',
};
