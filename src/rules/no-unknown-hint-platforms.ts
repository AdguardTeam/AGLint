import { type Value } from '@adguard/agtree';

import { defineRule, LinterRuleType } from '../linter-new/rule';

// https://adguard.com/kb/general/ad-filtering/create-own-filters/#platform-and-not_platform-hints
const KNOWN_PLATFORMS = new Set([
    'windows',
    'mac',
    'cli',
    'android',
    'ios',
    'ext_chromium_mv3',
    'ext_chromium',
    'ext_ff',
    'ext_edge',
    'ext_opera',
    'ext_safari',
    'ext_android_cb',
    'ext_ublock',
]);

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unknown-hint-platforms',
            description: 'Checks if platforms in related hints are known',
            recommended: true,
        },
        messages: {
            unknownPlatform: 'Unknown platform "{{platform}}"',
        },
    },
    create: (context) => {
        const handler = (node: Value) => {
            if (KNOWN_PLATFORMS.has(node.value)) {
                return;
            }

            context.report({
                messageId: 'unknownPlatform',
                data: {
                    platform: node.value,
                },
                node,
            });
        };

        return {
            'Hint[name.value="PLATFORM"] > ParameterList > Value': handler,
            'Hint[name.value="NOT_PLATFORM"] > ParameterList > Value': handler,
        };
    },
});
