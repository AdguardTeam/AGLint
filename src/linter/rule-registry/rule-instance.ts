import { render } from 'micromustache';
import * as v from 'valibot';

import { getErrorMessage } from '../../utils/error';
import { type LinterReporter } from '../core/report';
import {
    type LinterRule,
    type LinterRuleBaseConfig,
    type LinterRuleBaseContext,
    type LinterRuleConfig,
    linterRuleConfigSchema,
    type LinterRuleContext,
    type LinterRuleSeverity,
    type LinterRuleType,
    type LinterRuleVisitors,
    type WithMessages,
} from '../rule';

/**
 * Represents an instance of a linter rule with its configuration and runtime state.
 *
 * This class wraps a rule definition with its specific configuration, severity level,
 * and provides methods to access rule metadata and create visitors.
 *
 * @example
 * ```typescript
 * const instance = new LinterRuleInstance(
 *   'no-invalid-css',
 *   rule,
 *   ['error', { strict: true }]
 * );
 * const visitors = instance.createVisitors(baseContext, reporter);
 * ```
 */
export class LinterRuleInstance {
    /**
     * The underlying rule definition.
     */
    private readonly rule: LinterRule;

    /**
     * The unique identifier for this rule instance.
     */
    private readonly id: string;

    /**
     * The current severity level of the rule (Off, Warning, or Error).
     */
    private severity!: LinterRuleSeverity;

    /**
     * The parsed configuration for the rule (excluding severity).
     */
    private readonly config: LinterRuleBaseConfig;

    /**
     * Creates a new linter rule instance.
     *
     * @param id The unique identifier for this rule.
     * @param rule The rule definition.
     * @param config The rule configuration (severity and optional parameters).
     *
     * @throws Error if the configuration is invalid.
     */
    constructor(id: string, rule: LinterRule, config: LinterRuleConfig) {
        this.id = id;
        this.rule = rule;
        this.config = [];

        this.setConfig(config);
    }

    /**
     * Returns the unique identifier of this rule instance.
     *
     * @returns The rule ID.
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Returns the current severity level of this rule.
     *
     * @returns The severity level (Off, Warning, or Error).
     */
    public getSeverity(): LinterRuleSeverity {
        return this.severity;
    }

    /**
     * Returns the parsed configuration for this rule.
     *
     * @returns The rule configuration array (excluding severity).
     */
    public getConfig(): LinterRuleBaseConfig {
        return this.config;
    }

    /**
     * Checks if this rule provides automatic fixes.
     *
     * @returns True if the rule can automatically fix issues.
     */
    public hasFix(): boolean {
        return !!this.rule.meta.hasFix;
    }

    /**
     * Checks if this rule provides suggestions for fixes.
     *
     * @returns True if the rule can provide manual fix suggestions.
     */
    public hasSuggestions(): boolean {
        return !!this.rule.meta.hasSuggestions;
    }

    /**
     * Returns the type of this rule.
     *
     * @returns The rule type (Problem, Suggestion, or Layout).
     */
    public getType(): LinterRuleType {
        return this.rule.meta.type;
    }

    /**
     * Updates the configuration for this rule instance.
     *
     * Parses the provided configuration, extracts the severity level,
     * validates additional configuration parameters against the rule's schema,
     * and applies default values if needed.
     *
     * @param config The new rule configuration (severity or [severity, ...options]).
     *
     * @throws Error if the configuration format is invalid.
     * @throws Error if the rule doesn't accept configuration but options were provided.
     * @throws Error if the configuration options don't match the rule's schema.
     *
     * @example
     * ```typescript
     * // Set severity only
     * instance.setConfig('error');
     *
     * // Set severity with options
     * instance.setConfig(['warn', { strict: true }]);
     * ```
     */
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

                let parsedRestConfig;

                try {
                    parsedRestConfig = v.parse(
                        this.rule.meta.configSchema,
                        parsedConfig.slice(1),
                    );
                } catch (e) {
                    // eslint-disable-next-line max-len
                    throw new Error(`Rule '${this.rule.meta.docs.name}' has invalid configuration: ${getErrorMessage(e)}`);
                }

                // Empty the config array, but keep the reference,
                // because we pass the array to the visitors context
                this.config.length = 0;
                this.config.push(...parsedRestConfig);
            }
        } else {
            // severity-only case
            this.severity = parsedConfig;

            if (this.rule.meta.configSchema) {
                this.config.length = 0;
                try {
                    // eslint-disable-next-line max-len
                    const parsedDefaultConfig = v.parse(this.rule.meta.configSchema, this.rule.meta.defaultConfig ?? []);

                    this.config.push(...parsedDefaultConfig);
                } catch (e) {
                    // eslint-disable-next-line max-len
                    throw new Error(`Rule '${this.rule.meta.docs.name}' has invalid default configuration: ${getErrorMessage(e)}`);
                }
            }
        }
    }

    /**
     * Generates a human-readable message from a report.
     *
     * If the report contains a messageId, it looks up the template from the rule's
     * messages and renders it with the provided data. Direct messages take precedence.
     *
     * @param report The problem report containing either a message or messageId.
     *
     * @returns The formatted message string.
     *
     * @example
     * ```typescript
     * // Using messageId with template
     * const message = instance.getMessage({
     *   messageId: 'invalidProperty',
     *   data: { prop: 'color' }
     * });
     * // Returns: "Property 'color' is invalid"
     *
     * // Using direct message
     * const message = instance.getMessage({
     *   message: 'Custom error message'
     * });
     * // Returns: "Custom error message"
     * ```
     */
    public getMessage(report: WithMessages): string {
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
     *
     * Constructs a complete context by combining the base context with rule-specific
     * configuration and a report function, then invokes the rule's create function
     * to generate the visitor map.
     *
     * @param baseContext The base linting context (source code, file path, etc.).
     * @param reporter Optional function to report problems found by the rule.
     *
     * @returns A map of CSS selectors to visitor functions.
     *
     * @example
     * ```typescript
     * const visitors = instance.createVisitors(
     *   { sourceCode, filePath: 'filters.txt' },
     *   (problem, rule) => console.log(problem)
     * );
     * // Returns: { 'NetworkRule': (node) => { ... }, ... }
     * ```
     */
    public createVisitors(
        baseContext: LinterRuleBaseContext,
        reporter?: LinterReporter,
    ): LinterRuleVisitors {
        const context: LinterRuleContext = {
            ...baseContext,
            id: this.id,
            config: this.config,
            report: (problem) => {
                reporter?.(problem, this);
            },
        };

        return this.rule.create(context);
    }
}
