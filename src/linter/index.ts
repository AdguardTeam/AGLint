/**
 * AGLint core
 */

// Linter stuff
import { assert } from 'superstruct';
import cloneDeep from 'clone-deep';
import {
    defaultLinterConfig, mergeConfigs, linterRulesSchema,
} from './config';
import { defaultLinterRules } from './rules';
import { ConfigCommentType } from './inline-config';
import {
    SEVERITY, getSeverity, AnySeverity, isSeverity,
} from './severity';
import { NewLineSplit, StringUtils } from '../utils/string';
import {
    GenericRuleContext,
    LinterConfig,
    LinterPosition,
    LinterProblemReport,
    LinterRule,
    LinterRuleConfig,
    LinterRuleConfigObject,
    LinterRuleStorage,
} from './common';
import { AnyRule, CommentRuleType, RuleCategory } from '../parser/nodes';
import { RuleParser } from '../parser/rule';

/**
 * Represents a linter result that is returned by the `lint` method
 */
export interface LinterResult {
    /**
     * Array of problems detected by the linter
     */
    problems: LinterProblem[];

    /**
     * Count of warnings (just for convenience, can be calculated from problems array)
     */
    warningCount: number;

    /**
     * Count of errors (just for convenience, can be calculated from problems array)
     */
    errorCount: number;

    /**
     * Count of fatal errors (just for convenience, can be calculated from problems array)
     */
    fatalErrorCount: number;

    /**
     * The fixed filter list content. This is only available if the `fix` option is set to `true`.
     */
    fixed?: string;
}

/**
 * Represents a problem given by the linter
 */
export interface LinterProblem {
    /**
     * Name of the linter rule that generated this problem
     */
    rule?: string;

    /**
     * The severity of this problem (it practically inherits the rule severity)
     */
    severity: AnySeverity;

    /**
     * Text description of the problem
     */
    message: string;

    /**
     * The location of the problem
     */
    position: LinterPosition;

    /**
     * Suggested fix for the problem (if available)
     */
    fix?: AnyRule | AnyRule[];
}

/**
 * Represents a linter rule data object. Basically used internally by the linter,
 * so no need to export this.
 */
export interface LinterRuleData {
    /**
     * The linter rule itself. It's meta provides the rule severity and default config,
     * which can be overridden by the user here.
     */
    rule: LinterRule;

    /**
     * Storage for storing data between events. This storage is only visible
     * to the rule.
     */
    storage: LinterRuleStorage;

    /**
     * Custom config for the rule (it overrides the default config if provided)
     */
    configOverride?: unknown;

    /**
     * Custom severity for the rule (it overrides the default severity if provided)
     */
    severityOverride?: AnySeverity;
}

/**
 * Core linter logic
 */
export class Linter {
    /**
     * A map of rule names to `LinterRule` objects
     */
    private readonly rules: Map<string, LinterRuleData> = new Map();

    /**
     * The linter configuration
     */
    private config: LinterConfig = defaultLinterConfig;

    /**
     * Creates a new linter instance.
     *
     * @param defaultRules - Whether to add all default rules to the linter
     * @param config - The linter configuration
     */
    constructor(defaultRules = true, config: LinterConfig = defaultLinterConfig) {
        if (defaultRules) {
            this.addDefaultRules();
        }

        this.setConfig(config);
    }

    /**
     * Adds all default rules to the linter.
     */
    public addDefaultRules(): void {
        for (const [name, rule] of defaultLinterRules) {
            this.addRule(name, rule);
        }
    }

    /**
     * Sets the config for a given rule. It just overrides the default config.
     *
     * @param ruleName The name of the rule to set the config for
     * @param ruleConfig The config to set
     * @throws If the rule doesn't exist
     * @throws If the rule severity / config is invalid
     * @throws If the rule doesn't support config
     */
    public setRuleConfig(ruleName: string, ruleConfig: LinterRuleConfig): void {
        const entry = this.rules.get(ruleName);

        if (!entry) {
            throw new Error(`Rule "${ruleName}" doesn't exist`);
        }

        const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;

        let config: undefined | unknown;

        if (Array.isArray(ruleConfig) && ruleConfig.length > 1) {
            const rest = ruleConfig.slice(1);
            config = rest.length === 1 ? rest[0] : rest;
        }

        if (!isSeverity(severity)) {
            throw new Error(`Invalid severity "${severity}" for rule "${ruleName}"`);
        }

        entry.severityOverride = getSeverity(severity);

        if (config !== undefined) {
            if (!entry.rule.meta.config) {
                throw new Error(`Rule "${ruleName}" doesn't support config`);
            }

            try {
                assert(config, entry.rule.meta.config.schema);
            } catch (err: unknown) {
                throw new Error(`Invalid config for rule "${ruleName}": ${(err as Error).message}`);
            }
            entry.configOverride = config;
        }

        this.rules.set(ruleName, entry);
    }

    /**
     * This method applies the configuration "rules" part to the linter.
     *
     * @param rulesConfig Rules config object
     */
    public applyRulesConfig(rulesConfig: LinterRuleConfigObject) {
        for (const [ruleName, ruleConfig] of Object.entries(rulesConfig)) {
            this.setRuleConfig(ruleName, ruleConfig);
        }
    }

    /**
     * Gets the linter configuration.
     *
     * @returns The linter configuration
     */
    public getConfig(): LinterConfig {
        return cloneDeep(this.config);
    }

    /**
     * Sets the linter configuration. If `reset` is set to `true`, all rule
     * configurations are reset to their default values (removing overrides).
     *
     * @param config Core linter configuration
     * @param reset Whether to reset all rule configs
     */
    public setConfig(config: LinterConfig, reset = true): void {
        // Merge with default config
        this.config = mergeConfigs(defaultLinterConfig, config);

        // Reset all rule configs
        if (reset) {
            for (const entry of this.rules.values()) {
                entry.configOverride = undefined;
                entry.severityOverride = undefined;
            }
        }

        if (config.rules) {
            this.applyRulesConfig(config.rules);
        }
    }

    /**
     * Adds a new rule to the linter.
     *
     * @param name The name of the rule
     * @param rule The rule itself
     * @throws If the rule name is already taken
     */
    public addRule(name: string, rule: LinterRule): void {
        this.addRuleEx(name, {
            rule,

            // Initialize storage as empty object
            storage: {},
        });
    }

    /**
     * Adds a new rule to the linter, but you can specify the rule data.
     *
     * @param name The name of the rule
     * @param data The rule data, see `LinterRuleData` interface for more details
     * @throws If the rule name is already taken
     * @throws If the rule severity is invalid
     * @throws If the rule config is invalid
     */
    public addRuleEx(name: string, data: LinterRuleData): void {
        if (this.rules.has(name)) {
            throw new Error(`Rule with name "${name}" already exists`);
        }

        const clone = cloneDeep(data);

        if (clone.severityOverride) {
            // Validate severity
            if (!isSeverity(clone.severityOverride)) {
                throw new Error(`Invalid severity "${clone.severityOverride}" for rule "${name}"`);
            }

            // Convert to number
            clone.severityOverride = getSeverity(clone.severityOverride);
        }

        if (clone.configOverride) {
            if (!clone.rule.meta.config) {
                throw new Error(`Rule "${name}" doesn't support config`);
            } else {
                try {
                    assert(clone.configOverride, clone.rule.meta.config.schema);
                } catch (err: unknown) {
                    throw new Error(`Invalid config for rule "${name}": ${(err as Error).message}`);
                }
            }
        }

        // Add rule to the repository
        this.rules.set(name, clone);
    }

    /**
     * Resets default config for the rule with the specified name.
     *
     * @param name The name of the rule
     * @throws If the rule doesn't exist
     * @throws If the rule doesn't support config
     */
    public resetRuleConfig(name: string): void {
        // Find the rule
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" doesn't exist`);
        }

        if (!entry.rule.meta.config) {
            throw new Error(`Rule "${name}" doesn't support config`);
        }

        // Set the config to undefined, so the default config will be used next time
        entry.severityOverride = undefined;
        entry.configOverride = undefined;
    }

    /**
     * Gets the current config for the rule with the specified name.
     *
     * @param name The name of the rule
     * @returns The currently active config for the rule. If no override is set,
     * the default config is returned.
     * @throws If the rule doesn't exist
     * @throws If the rule doesn't support config
     */
    public getRuleConfig(name: string): LinterRuleConfig {
        // Find the rule
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" doesn't exist`);
        }

        if (!entry.rule.meta.config) {
            throw new Error(`Rule "${name}" doesn't support config`);
        }

        return [
            isSeverity(entry.severityOverride) ? entry.severityOverride : entry.rule.meta.severity,
            entry.configOverride || entry.rule.meta.config.default,
        ];
    }

    /**
     * Returns the `LinterRule` object with the specified name.
     *
     * @param name - The name of the rule
     * @returns The `LinterRule` object, or `undefined` if no such rule exists
     */
    public getRule(name: string): LinterRule | undefined {
        return cloneDeep(this.rules.get(name)?.rule);
    }

    /**
     * Returns the map of all rules in the repository.
     *
     * @returns The map of rule names to `LinterRule` objects
     */
    public getRules(): Map<string, LinterRuleData> {
        return cloneDeep(this.rules);
    }

    /**
     * Returns whether a rule with the specified name exists in the repository.
     *
     * @param name - The name of the rule
     * @returns `true` if the rule exists, `false` otherwise
     */
    public hasRule(name: string): boolean {
        return this.rules.has(name);
    }

    /**
     * Removes a rule from the repository.
     *
     * @param name - The name of the rule
     */
    public removeRule(name: string): void {
        if (!this.rules.has(name)) {
            throw new Error(`Rule with name "${name}" does not exist`);
        }

        this.rules.delete(name);
    }

    /**
     * Disables a rule by name.
     *
     * @param name - The name of the rule
     * @throws If the rule does not exist
     */
    public disableRule(name: string): void {
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" does not exist`);
        }

        entry.severityOverride = SEVERITY.off;

        this.rules.set(name, entry);
    }

    /**
     * Enables a rule
     *
     * @param name - The name of the rule
     * @throws If the rule does not exist
     */
    public enableRule(name: string): void {
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" does not exist`);
        }

        entry.severityOverride = undefined;

        this.rules.set(name, entry);
    }

    /**
     * Returns whether a rule is disabled.
     *
     * @param name - The name of the rule
     * @returns `true` if the rule is disabled, `false` otherwise
     */
    public isRuleDisabled(name: string): boolean {
        const entry = this.rules.get(name);

        if (!entry) {
            return false;
        }

        const severity = isSeverity(entry.severityOverride) ? entry.severityOverride : entry.rule.meta.severity;

        // Don't forget to convert severity to number (it can be a string,
        // if it was set by the user, and it's can be confusing)
        return getSeverity(severity) === SEVERITY.off;
    }

    /**
     * Lints the list of rules (typically this is the content of a filter list).
     *
     * @param content - Filter list content
     * @param fix - Include fixes in the result. Please note that if more than one fix
     * is available for a single problem, then the line will be skipped.
     * @returns Linter result
     */
    public lint(content: string, fix = false): LinterResult {
        // Prepare linting result
        const result: LinterResult = {
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        };

        let isDisabled = false;

        // A set of linter rule names that are disabled on the next line
        const nextLineDisabled = new Set<string>();
        let isDisabledForNextLine = false;

        // A set of linter rule names that are enabled on the next line
        const nextLineEnabled = new Set<string>();
        let isEnabledForNextLine = false;

        // Store the actual line number here for the context object
        let actualLine = 0;

        // Store the actual rule here for the context object
        let actualAdblockRuleAst: AnyRule | undefined;
        let actualAdblockRuleRaw: string | undefined;

        /**
         * Invokes an event for all rules. This function is only used internally
         * by the actual linting, so we define it here.
         *
         * The context is dependent on the actual linting environment, so we create
         * a new context object for each event within this function.
         *
         * @param event - The event to invoke (e.g. `onRule`)
         */
        const invokeEvent = (event: keyof LinterRule['events']): void => {
            for (const [name, data] of this.rules) {
                // If the rule is disabled, skip it
                if (
                    (this.isRuleDisabled(name) // rule is disabled at config level
                        || nextLineDisabled.has(name)) // or rule is disabled for the next line
                    && !nextLineEnabled.has(name) // and rule is not enabled for the next line
                ) {
                    continue;
                }

                // Validate rule configuration (if it exists)
                if (data.rule.meta.config) {
                    assert(data.configOverride || data.rule.meta.config.default, data.rule.meta.config.schema);
                }

                // Get event handler for the rule
                const eventHandler = data.rule.events[event];

                // Invoke event handler (if it exists)
                if (eventHandler) {
                    // Create a context object and freeze it in order to prevent
                    // accidental / unwanted modifications
                    const context: GenericRuleContext = Object.freeze({
                        // Deep copy of the linter configuration
                        getLinterConfig: () => ({ ...this.config }),

                        // Currently linted filter list content
                        getFilterListContent: () => content,

                        // Currently iterated adblock rule
                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        getActualAdblockRuleAst: () => (actualAdblockRuleAst ? { ...actualAdblockRuleAst } : undefined),

                        // Currently iterated adblock rule
                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        getActualAdblockRuleRaw: () => (actualAdblockRuleRaw || undefined),

                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        getActualLine: () => actualLine,

                        fixingEnabled: () => fix,

                        // Storage reference
                        storage: data.storage,

                        // Rule configuration
                        config: data.configOverride || data.rule.meta.config?.default,

                        // Reporter function
                        report: (problem: LinterProblemReport) => {
                            let severity = getSeverity(data.rule.meta.severity);

                            if (!nextLineEnabled.has(name)) {
                                if (isSeverity(data.severityOverride)) {
                                    severity = getSeverity(data.severityOverride);
                                }
                            }

                            result.problems.push({
                                rule: name,
                                severity,
                                message: problem.message,
                                position: { ...problem.position },
                                fix: problem.fix,
                            });

                            // Update problem counts
                            switch (severity) {
                                case SEVERITY.warn:
                                    result.warningCount += 1;
                                    break;
                                case SEVERITY.error:
                                    result.errorCount += 1;
                                    break;
                                case SEVERITY.fatal:
                                    result.fatalErrorCount += 1;
                                    break;
                                default:
                                    break;
                            }
                        },
                    });

                    // Invoke event handler with the context object
                    eventHandler(context);
                }
            }
        };

        // Invoke onStartFilterList event before parsing the filter list
        invokeEvent('onStartFilterList');

        // Get lines (rules) of the filter list
        const rules = StringUtils.splitStringByNewLinesEx(content);

        // Iterate over all filter list adblock rules
        rules.forEach((rule, index) => {
            // Update actual line number for the context object
            actualLine = index + 1;

            // Process the line
            const code = ((): number => {
                try {
                    // Parse the current adblock rule, but this throw an error if the rule is invalid.
                    // We catch the error and report it as a problem.
                    const ast = RuleParser.parse(rule[0]);

                    // Handle inline config comments
                    if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.ConfigCommentRule) {
                        // If inline config is not allowed in the linter configuration,
                        // simply skip the comment processing
                        if (!this.config.allowInlineConfig) {
                            return 0;
                        }

                        // Process the inline config comment
                        switch (ast.command.value) {
                            case ConfigCommentType.Main: {
                                if (ast.params && ast.params.type === 'Value') {
                                    assert(ast.params.value, linterRulesSchema);

                                    this.config = mergeConfigs(this.config, {
                                        rules: ast.params.value,
                                    });

                                    this.applyRulesConfig(ast.params.value);
                                }

                                break;
                            }

                            case ConfigCommentType.Disable: {
                                if (ast.params && ast.params.type === 'ParameterList') {
                                    for (const param of ast.params.children) {
                                        this.disableRule(param.value);
                                    }

                                    break;
                                }

                                isDisabled = true;
                                break;
                            }

                            case ConfigCommentType.Enable: {
                                if (ast.params && ast.params.type === 'ParameterList') {
                                    for (const param of ast.params.children) {
                                        this.enableRule(param.value);
                                    }

                                    break;
                                }

                                isDisabled = false;
                                break;
                            }

                            case ConfigCommentType.DisableNextLine: {
                                // Disable specific rules for the next line
                                if (ast.params && ast.params.type === 'ParameterList') {
                                    for (const param of ast.params.children) {
                                        nextLineDisabled.add(param.value);
                                    }
                                } else {
                                    // Disable all rules for the next line
                                    isDisabledForNextLine = true;
                                }

                                break;
                            }

                            case ConfigCommentType.EnableNextLine: {
                                // Enable specific rules for the next line
                                if (ast.params && ast.params.type === 'ParameterList') {
                                    for (const param of ast.params.children) {
                                        nextLineEnabled.add(param.value);
                                    }
                                } else {
                                    // Disable all rules for the next line
                                    isEnabledForNextLine = true;
                                }

                                break;
                            }

                            default:
                                break;
                        }

                        // The config comment has been processed, there is nothing more to do with the line
                        // But we need to return 1, because we processed an inline config comment
                        return 1;
                    }
                    // If the linter is actually disabled, skip the rule processing.
                    // It is important to do this check here, because we need to
                    // process the inline config comments even if the linter is disabled
                    // (in this way we could detect the `enable` command, for example).
                    if ((isDisabled || isDisabledForNextLine) && !isEnabledForNextLine) {
                        return 0;
                    }

                    // Deep copy of the line data
                    actualAdblockRuleAst = { ...ast };
                    [actualAdblockRuleRaw] = rule;

                    // Invoke onRule event for all rules (process actual adblock rule)
                    invokeEvent('onRule');
                } catch (error: unknown) {
                    // If the linter is actually disabled, skip the error reporting
                    if ((isDisabled || isDisabledForNextLine) && !isEnabledForNextLine) {
                        return 0;
                    }

                    if (error instanceof Error) {
                        // If an error occurs during parsing, it means that the rule is invalid,
                        // that is, it could not be parsed for some reason. This is a fatal error,
                        // since the linter rules can only accept AST.
                        result.problems.push({
                            severity: SEVERITY.fatal,
                            message: `AGLint parsing error: ${error.message}`,
                            position: {
                                startLine: index + 1,
                                startColumn: 0,
                                endLine: index + 1,
                                endColumn: rule[0].length,
                            },
                        });

                        // Don't forget to increase the fatal error count when parsing fails
                        result.fatalErrorCount += 1;
                    }
                }

                return 0;
            })();

            // Clear next line stuff if the line was processed with code 0
            if (code === 0) {
                nextLineDisabled.clear();
                nextLineEnabled.clear();
                isDisabledForNextLine = false;
                isEnabledForNextLine = false;
            }
        });

        // Invoke onEndFilterList event after parsing the filter list
        invokeEvent('onEndFilterList');

        // Build fixed content if fixing is enabled
        if (fix) {
            // Create a new array for the fixed content (later we will join it)
            const fixes: NewLineSplit = [];

            // Iterate over all lines in the original content (filter list content)
            for (let i = 0; i < rules.length; i += 1) {
                let conflict = false;
                let foundFix: AnyRule | AnyRule[] | undefined;

                // Iterate over all problems and check if the problem is on the current line
                for (const problem of result.problems) {
                    // TODO: Currently we only support fixes for single-line problems
                    if (problem.position.startLine === i + 1 && i + 1 === problem.position.endLine) {
                        // If the problem has a fix, check if there is a conflict.
                        // We can't fix the line if there are multiple fixes for the same line.
                        if (problem.fix) {
                            if (foundFix && foundFix !== problem.fix) {
                                conflict = true;
                                break;
                            }

                            foundFix = problem.fix;
                        }
                    }
                }

                // If there is a fix and there is no conflict, push the fix to the fixes array
                if (foundFix && !conflict) {
                    // If the fix is an array, we need to push all its elements
                    if (Array.isArray(foundFix)) {
                        for (const ast of foundFix) {
                            fixes.push([RuleParser.generate(ast), rules[i][1]]);
                        }
                    } else {
                        // Otherwise, we can simply push the generated (fixed) rule
                        fixes.push([RuleParser.generate(foundFix), rules[i][1]]);
                    }
                } else {
                    // Otherwise, push the original rule
                    fixes.push(rules[i]);
                }
            }

            // Join the fixed rules by newlines
            result.fixed = StringUtils.mergeStringByNewLines(fixes);
        }

        // Return linting result
        return result;
    }
}
