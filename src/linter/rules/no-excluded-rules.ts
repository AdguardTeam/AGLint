import ss from 'superstruct';

import { type LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { StringUtils } from '../../utils/string';

// Define rule config type (it is only relevant for the rule itself)
type RuleConfig = {
    // TODO: Add other options to exclude rules if needed
    'regexp-patterns': string[],
};

/**
 * Concreting the storage type definition (the linter only provides a general
 * form where the value type is unknown)
 */
interface RuleStorage {
    /**
     * Array of all exclude patterns, in RegExp form
     */
    'regexp-patterns': RegExp[];
}

/**
 * Fill this description with a short description of the rule.
 */
export const NoExcludedRules: LinterRule<RuleStorage, RuleConfig> = {
    // Define the metadata of the rule
    meta: {
        severity: SEVERITY.error,

        // TODO: Improve schema with transformation: https://github.com/AdguardTeam/AGLint/issues/217)
        config: {
            // Define the default config
            default: {
                // Define the default config values
                'regexp-patterns': [],
            },

            // Define the schema of the config
            schema: ss.object({
                'regexp-patterns': ss.array(ss.string()),
            }) as ss.Struct,
        },
    },
    // Define the events that the rule will listen to
    events: {
        onStartFilterList: (context): void => {
            // Each rule ONLY sees its own storage. At the beginning of the filter list,
            // we just initialize the storage.
            context.storage['regexp-patterns'] = [];

            for (const rawPattern of context.config['regexp-patterns']) {
                try {
                    let processedRawPattern = rawPattern;
                    if (StringUtils.isRegexPattern(rawPattern)) {
                        processedRawPattern = rawPattern.slice(1, -1);
                    }
                    context.storage['regexp-patterns'].push(new RegExp(processedRawPattern));
                } catch (error) {
                    // TODO: handle later
                }
            }
        },
        onRule: (context): void => {
            const { 'regexp-patterns': excludePatterns } = context.storage;

            if (excludePatterns.length === 0) {
                return;
            }

            const rawRuleText = context.getActualAdblockRuleRaw();

            for (const pattern of excludePatterns) {
                if (pattern.test(rawRuleText)) {
                    context.report({
                        message: `Rule matches an excluded pattern: ${pattern}`,
                    });
                    break;
                }
            }
        },
    },
};
