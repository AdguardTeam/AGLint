import { type LinterRule } from '../rule';

/**
 * Function to load a rule by its name.
 *
 * @param ruleName The name of the rule to load.
 *
 * @returns Promise that resolves to the loaded rule.
 */
export type LinterRuleLoader = (ruleName: string) => Promise<LinterRule>;
