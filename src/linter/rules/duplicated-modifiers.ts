// Linter stuff
import { GenericRuleContext } from '..';
import { LinterRule } from '../rule';
import { SEVERITY } from '../severity';

// Parser stuff
import { AnyRule } from '../../parser';
import { RuleCategory } from '../../parser/categories';
import { NetworkRuleType } from '../../parser/network/types';

/**
 * Rule that checks if a network rule contains multiple same modifiers
 */
export const DuplicatedModifiers = <LinterRule>{
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is a basic network rule
            if (ast.category === RuleCategory.Network && ast.type === NetworkRuleType.BasicNetworkRule) {
                // Count the number of each modifier
                const stat: { [key: string]: number } = {};

                for (const { modifier } of ast.modifiers) {
                    stat[modifier] = stat[modifier] ? stat[modifier] + 1 : 1;
                }

                for (const [modifier, count] of Object.entries(stat)) {
                    // Check if the modifier is occurs multiple times
                    if (count > 1) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `The modifier "${modifier}" is used multiple times, but it should be used only once`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
                        });
                    }
                }
            }
        },
    },
};
