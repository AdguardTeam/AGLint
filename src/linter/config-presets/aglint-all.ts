/**
 * @file Configuration preset for AGLint that enables all rules.
 */

import { LinterConfig } from '../common';

const config: LinterConfig = {
    rules: {
        'duplicated-hint-platforms': 'error',
        'duplicated-hints': 'error',
        'duplicated-modifiers': 'error',
        'if-closed': 'error',
        'inconsistent-hint-platforms': 'error',
        'invalid-domain-list': 'error',
        'single-selector': 'error',
        'unknown-hints-and-platforms': 'error',
        'unknown-preprocessor-directives': 'error',
    },
};

export default Object.freeze(config);
