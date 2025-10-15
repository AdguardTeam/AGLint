import { type LinterConfig, type LinterRulesConfig } from '../config';
import { type LinterProblemReport, type LinterRuleBaseContext, LinterRuleSeverity } from '../rule';
import { type LinterVisitorCollection } from '../source-code/visitor-collection';

import { LinterRuleInstance } from './rule-instance';
import { type LinterRuleLoader } from './rule-loader';

export class LinterRuleRegistry {
    private rules: Map<string, LinterRuleInstance>;

    private config: LinterConfig;

    private visitorCollection: LinterVisitorCollection;

    private loadRule: LinterRuleLoader;

    private baseRuleContext: LinterRuleBaseContext;

    private reporter: (report: LinterProblemReport, ruleInstance: LinterRuleInstance) => void;

    constructor(
        config: LinterConfig,
        visitorCollection: LinterVisitorCollection,
        baseRuleContext: LinterRuleBaseContext,
        reporter: (report: LinterProblemReport, ruleInstance: LinterRuleInstance) => void,
        loadRule: LinterRuleLoader,
    ) {
        this.rules = new Map();

        this.config = config;
        this.visitorCollection = visitorCollection;
        this.baseRuleContext = baseRuleContext;

        this.reporter = reporter;
        this.loadRule = loadRule;
    }

    /**
     * Loads rules from the linter config.
     * If a rule could not be loaded, an error will be thrown.
     *
     * @throws If a rule is not found.
     */
    // FIXME: return visitors
    public async loadRules(): Promise<void> {
        const tasks = Object.entries(this.config.rules).map(async ([ruleName, ruleConfig]) => {
            const rule = await this.loadRule(ruleName);

            // FIXME: valibot schema
            if (!rule.meta?.docs?.name || typeof rule.create !== 'function') {
                throw new Error(`Invalid rule module: ${ruleName}`);
            }

            const instance = new LinterRuleInstance(
                ruleName,
                rule,
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

    public applyConfig(rulesConfig: LinterRulesConfig): void {
        for (const [ruleName, ruleConfig] of Object.entries(rulesConfig)) {
            const rule = this.getRuleFromStorageOrThrow(ruleName);
            rule.setConfig(ruleConfig);
        }
    }

    public hasRule(ruleName: string): boolean {
        return this.rules.has(ruleName);
    }

    private addRule(rule: LinterRuleInstance): void {
        this.rules.set(rule.getId(), rule);
    }

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
