import * as v from 'valibot';

import { type LinterConfigParsed, type LinterRulesConfig } from '../config';
import { type LinterReporter } from '../core/report';
import { type LinterRuleBaseContext, linterRuleSchema, LinterRuleSeverity } from '../rule';
import { type LinterVisitorCollection } from '../source-code/visitor-collection';

import { LinterRuleInstance } from './rule-instance';
import { type LinterRuleLoader } from './rule-loader';

/**
 * Manages the lifecycle and execution of linter rules.
 *
 * The registry is responsible for:
 * - Loading rules from configuration
 * - Validating rule structure
 * - Creating rule instances with their configurations
 * - Managing visitor registration
 * - Applying configuration updates
 *
 * @example
 * ```typescript
 * const registry = new LinterRuleRegistry(
 *   parsedConfig,
 *   visitorCollection,
 *   baseContext,
 *   async (name) => import(`./rules/${name}`)
 * );
 *
 * await registry.loadRules();
 * registry.setReporter((problem, rule) => {
 *   console.log(`${rule.getId()}: ${problem.message}`);
 * });
 * ```
 */
export class LinterRuleRegistry {
    /**
     * Map of rule IDs to their instances.
     */
    private rules: Map<string, LinterRuleInstance>;

    /**
     * The parsed linter configuration.
     */
    private config: LinterConfigParsed;

    /**
     * The collection that manages AST visitors.
     */
    private visitorCollection: LinterVisitorCollection;

    /**
     * Function to dynamically load rule modules.
     */
    private loadRule: LinterRuleLoader;

    /**
     * The base context shared by all rules.
     */
    private baseRuleContext: LinterRuleBaseContext;

    /**
     * Optional reporter function for problems found by rules.
     */
    private reporter?: LinterReporter;

    /**
     * Creates a new linter rule registry.
     *
     * @param config - The parsed linter configuration containing rule settings
     * @param visitorCollection - The visitor collection to register rule visitors
     * @param baseRuleContext - The base context passed to all rules (source code, etc.)
     * @param loadRule - Function to load rule modules by name
     */
    constructor(
        config: LinterConfigParsed,
        visitorCollection: LinterVisitorCollection,
        baseRuleContext: LinterRuleBaseContext,
        loadRule: LinterRuleLoader,
    ) {
        this.rules = new Map();

        this.config = config;
        this.visitorCollection = visitorCollection;
        this.baseRuleContext = baseRuleContext;

        this.loadRule = loadRule;
    }

    /**
     * Sets the reporter function for handling problems found by rules.
     *
     * @param reporter - Function called when a rule reports a problem
     */
    public setReporter(reporter: LinterReporter): void {
        this.reporter = reporter;
    }

    /**
     * Loads and initializes all rules from the linter configuration.
     *
     * This method:
     * 1. Loads each rule module using the loader function
     * 2. Validates the rule structure against the schema
     * 3. Creates a rule instance with its configuration
     * 4. Skips rules with severity "off"
     * 5. Registers the rule's visitors with the visitor collection
     *
     * All rules are loaded in parallel for performance.
     *
     * @throws Error if a rule module cannot be loaded
     * @throws Error if a rule fails schema validation
     * @throws Error if a rule configuration is invalid
     *
     * @example
     * ```typescript
     * const registry = new LinterRuleRegistry(config, visitors, context, loader);
     * await registry.loadRules();
     * // All configured rules are now loaded and ready
     * ```
     */
    public async loadRules(): Promise<void> {
        const tasks = Object.entries(this.config.rules).map(async ([ruleName, ruleConfig]) => {
            const rule = await this.loadRule(ruleName);

            // Validate rule against schema
            const parseResult = v.parse(linterRuleSchema, rule);

            const instance = new LinterRuleInstance(
                ruleName,
                parseResult,
                ruleConfig,
            );

            if (instance.getSeverity() === LinterRuleSeverity.Off) {
                return;
            }

            this.addRule(instance);

            const visitors = instance.createVisitors(
                this.baseRuleContext,
                this.reporter,
            );

            for (const [selector, visitor] of Object.entries(visitors)) {
                this.visitorCollection.addVisitor(selector, visitor);
            }
        });

        await Promise.all(tasks);
    }

    /**
     * Applies new configuration to already-loaded rules.
     *
     * This allows updating rule severities and options without reloading.
     * Only affects rules that have already been loaded.
     *
     * @param rulesConfig - Map of rule names to their new configurations
     *
     * @throws Error if a referenced rule hasn't been loaded
     *
     * @example
     * ```typescript
     * registry.applyConfig({
     *   'no-invalid-css': 'warn',
     *   'scriptlet-quotes': ['error', { prefer: 'double' }]
     * });
     * ```
     */
    public applyConfig(rulesConfig: LinterRulesConfig): void {
        for (const [ruleName, ruleConfig] of Object.entries(rulesConfig)) {
            const rule = this.getRuleFromStorageOrThrow(ruleName);
            rule.setConfig(ruleConfig);
        }
    }

    /**
     * Checks if a rule has been loaded into the registry.
     *
     * @param ruleName - The name of the rule to check
     *
     * @returns True if the rule is loaded, false otherwise
     */
    public hasRule(ruleName: string): boolean {
        return this.rules.has(ruleName);
    }

    /**
     * Adds a rule instance to the registry.
     *
     * @param rule - The rule instance to add
     */
    private addRule(rule: LinterRuleInstance): void {
        this.rules.set(rule.getId(), rule);
    }

    /**
     * Retrieves a rule instance from the registry.
     *
     * @param ruleName - The name of the rule to retrieve
     *
     * @returns The rule instance
     *
     * @throws Error if the rule is not found in the registry
     */
    private getRuleFromStorageOrThrow(ruleName: string): LinterRuleInstance {
        const ruleData = this.rules.get(ruleName);

        if (!ruleData) {
            throw new Error(`Rule '${ruleName}' not found`);
        }

        return ruleData;
    }

    // public* [Symbol.iterator](): Generator<[string, LinterRuleInstance]> {
    //     for (const [ruleName, ruleData] of this.rules) {
    //         yield [ruleName, ruleData];
    //     }
    // }
}
