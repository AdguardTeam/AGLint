/**
 * @file Configuration preset for AGLint that enables recommended rules,
 * which are useful for all projects.
 */

import { AdblockSyntax } from '@adguard/agtree/utils';

import { type LinterConfig } from '../common';

const config: LinterConfig = {
    syntax: [AdblockSyntax.Common],
    rules: {
        'no-invalid-css-syntax': 'error',
        'no-invalid-css-declaration': 'error',
        'duplicated-hint-platforms': 'error',
        'duplicated-hints': 'error',
        'duplicated-modifiers': 'error',
        'if-closed': 'error',
        'inconsistent-hint-platforms': 'error',
        'invalid-domain-list': 'error',
        'invalid-modifiers': 'error',
        'unknown-hints-and-platforms': 'error',
        'unknown-preprocessor-directives': 'error',
        'no-short-rules': 'error',
    },
};

export default Object.freeze(config);
