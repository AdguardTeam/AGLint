import { RuleCategory } from '@adguard/agtree';
import regexpTree from 'regexp-tree';

import { type LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { PIPE } from '../../common/constants';
import { StringUtils } from '../../utils/string';
import { getErrorMessage } from '../../utils/error';

/**
 * Validates network rule pattern.
 *
 * @param pattern Pattern to validate.
 * @returns `true` if pattern is valid, error message otherwise.
 */
const validateNetworkRulePattern = (pattern: string): true | string => {
    // pattern may a regular expression
    if (StringUtils.isRegexPattern(pattern)) {
        try {
            regexpTree.parse(pattern);
        } catch (error: unknown) {
            return `Invalid regular expression: ${getErrorMessage(error)}`;
        }

        return true;
    }

    let i = 0;

    // pattern may start with protocol mask (||) or begin pointer (|)
    if (pattern[i] === PIPE) {
        i += 1;

        if (pattern[i] === PIPE) {
            i += 1;
        }
    }

    // pattern may end with an ending pointer (|)
    // we check it here to avoid checking it in the loop
    let end = pattern.length - 1;

    if (pattern[end] === PIPE) {
        end -= 1;
    }

    // iterate over the pattern
    while (i < end) {
        // if we found pipe or space or tab we should report an error
        if (pattern[i] === PIPE || StringUtils.isWhitespace(pattern[i])) {
            return 'Unexpected pipe or whitespace character';
        }

        i += 1;
    }

    return true;
};

/**
 * Rule that checks if network rule pattern is valid.
 */
export const NoInvalidNetworkRulePattern: LinterRule = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context): void => {
            const node = context.getActualAdblockRuleAst();

            if (node.category === RuleCategory.Network) {
                const validationResult = validateNetworkRulePattern(node.pattern.value);
                if (validationResult !== true) {
                    context.report({
                        message: validationResult,
                        node: node.pattern,
                    });
                }
            }
        },
    },
};
