import { render } from 'micromustache';
import * as v from 'valibot';

import {
    type LinterProblemReport,
    type LinterRule,
    type LinterRuleBaseConfig,
    type LinterRuleBaseContext,
    type LinterRuleConfig,
    linterRuleConfigSchema,
    type LinterRuleContext,
    type LinterRuleSeverity,
    type LinterRuleVisitors,
} from '../rule';

export class LinterRuleInstance {
    private readonly rule: LinterRule;

    private readonly id: string;

    private severity!: LinterRuleSeverity;

    private readonly config: LinterRuleBaseConfig;

    constructor(id: string, rule: LinterRule, config: LinterRuleConfig) {
        this.id = id;
        this.rule = rule;
        this.config = [];

        this.setConfig(config);
    }

    public getId(): string {
        return this.id;
    }

    public getSeverity(): LinterRuleSeverity {
        return this.severity;
    }

    public getConfig(): LinterRuleBaseConfig {
        return this.config;
    }

    public hasFix(): boolean {
        return !!this.rule.meta.hasFix;
    }

    public hasSuggestions(): boolean {
        return !!this.rule.meta.hasSuggestions;
    }

    public setConfig(config: LinterRuleConfig): void {
        const parsedConfig = v.parse(linterRuleConfigSchema, config);

        if (Array.isArray(parsedConfig)) {
            // [severity[, ...config]] case

            // eslint-disable-next-line prefer-destructuring
            this.severity = parsedConfig[0];

            // If there are more than one element in the array, it means that there are additional config options
            // In this case we need to validate them against the rule's config schema
            if (parsedConfig.length > 1) {
                if (!this.rule.meta.configSchema) {
                    throw new Error(`Rule '${this.rule.meta.docs.name}' does not have a configuration schema`);
                }

                const parsedRestConfig = v.parse(
                    this.rule.meta.configSchema,
                    parsedConfig.slice(1),
                );

                // Empty the config array, but keep the reference,
                // because we pass the array to the visitors context
                this.config.length = 0;
                this.config.push(...parsedRestConfig);
            }
        } else {
            // severity-only case
            this.severity = parsedConfig;
        }
    }

    public getMessage(report: LinterProblemReport): string {
        let message = '';

        if (report.messageId) {
            const messageTemplate = this.rule.meta.messages?.[report.messageId];

            if (messageTemplate) {
                message = render(messageTemplate, report.data);
            }
        }

        if (report.message) {
            message = report.message;
        }

        return message;
    }

    /**
     * Creates a rule-specific context and initializes visitors.
     */
    public createVisitors(
        baseContext: LinterRuleBaseContext,
        reporter: (report: LinterProblemReport, ruleInstance: LinterRuleInstance) => void,
    ): LinterRuleVisitors {
        const context: LinterRuleContext = {
            ...baseContext,
            id: this.id,
            config: this.config,
            report: (problem) => {
                reporter(problem, this);
            },
        };

        return this.rule.create(context);
    }
}
