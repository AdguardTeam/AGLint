import { type Hint } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-hints',
            description: 'Checks if hints are duplicated within the same hint comment rule',
            recommended: true,
        },
        messages: {
            duplicatedHints: 'Duplicated hint "{{hint}}"',
        },
        correctExamples: [
            {
                name: 'PLATFORM hint with single parameter',
                code: [
                    '!+ PLATFORM(windows)',
                ].join('\n'),
            },
            {
                name: 'PLATFORM hint with multiple parameters',
                code: [
                    '!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera)',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: 'Duplicated hint "windows"',
                code: [
                    '!+ PLATFORM(windows, mac, windows, ios) PLATFORM(windows)',
                ].join('\n'),
            },
            {
                name: 'Duplicated hint "NOT_OPTIMIZED"',
                code: [
                    '!+ NOT_OPTIMIZED NOT_OPTIMIZED PLATFORM(windows)',
                ].join('\n'),
            },
        ],
        version: '1.0.9',
    },
    create: (context) => {
        const history: Set<string> = new Set();

        return {
            'HintCommentRule:exit': () => {
                history.clear();
            },
            Hint: (node: Hint) => {
                const name = node.name.value;
                const nameToLowerCase = name.toLowerCase();

                if (!history.has(nameToLowerCase)) {
                    history.add(nameToLowerCase);
                    return;
                }

                context.report({
                    messageId: 'duplicatedHints',
                    data: {
                        hint: name,
                    },
                    node,
                    // TODO: Add suggestion to remove the duplicated hint
                });
            },
        };
    },
});
