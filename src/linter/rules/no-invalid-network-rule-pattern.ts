import { RuleCategory } from '@adguard/agtree';
import regexpTree from 'regexp-tree';

import { type LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { PIPE } from '../../common/constants';
import { StringUtils } from '../../utils/string';
import { getErrorMessage } from '../../utils/error';

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
                const pattern = node.pattern.value;

                // pattern may a regular expression
                if (StringUtils.isRegexPattern(pattern)) {
                    try {
                        regexpTree.parse(pattern);
                    } catch (error: unknown) {
                        context.report({
                            message: `Invalid regular expression: ${getErrorMessage(error)}`,
                            node: node.pattern,
                        });
                    }

                    return;
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

                // iterate over the pattern and check for invalid characters
                while (i <= end) {
                    if (pattern[i] === PIPE) {
                        context.report({
                            message: 'Unexpected pipe character',
                            position: {
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                startLine: node.loc!.start.line,
                                startColumn: i,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                endLine: node.loc!.end.line,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                endColumn: node.loc!.end.column - 1,
                            },
                        });
                    }

                    if (StringUtils.isWhitespace(pattern[i])) {
                        context.report({
                            message: 'Unexpected whitespace character',
                            position: {
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                startLine: node.loc!.start.line,
                                startColumn: i,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                endLine: node.loc!.end.line,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                endColumn: node.loc!.end.column - 1,
                            },
                        });
                    }

                    i += 1;
                }
            }
        },
    },
};
