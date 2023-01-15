/**
 * AGLint core
 */

// Linter stuff
import { LinterRule } from "./rule";
import { LinterConfig, defaultLinterConfig } from "./config";
import { defaultLinterRules } from "./rules";
import { ConfigCommentType } from "./inline-config";
import { SEVERITY, getSeverity } from "./severity";

// Parser stuff
import { RuleCategory } from "../parser/categories";
import { CommentRuleType } from "../parser/comment/types";
import { AnyRule, RuleParser } from "../parser";
import { NEWLINE } from "../utils/constants";

import { StringUtils } from "../utils/string";
import { ArrayUtils } from "../utils/array";
import { assert } from "superstruct";
import { AnySeverity, isSeverity } from "./severity";

/**
 * Represents the location of a problem that detected by the linter
 */
export interface LinterPosition {
    /**
     * Start line number
     */
    startLine: number;

    /**
     * Start column position
     */
    startColumn?: number;

    /**
     * End line number
     */
    endLine: number;

    /**
     * End column position
     */
    endColumn?: number;
}

/**
 * Represents a problem report (this must be passed to context.report from the rules)
 */
export interface LinterProblemReport {
    /**
     * Text description of the problem
     */
    message: string;

    /**
     * The location of the problem
     */
    position: LinterPosition;

    /**
     * Suggested fix for the problem
     */
    fix?: AnyRule | AnyRule[];
}

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
 * Represents a linter context that is passed to the rules when their events are triggered
 */
export interface GenericRuleContext {
    /**
     * Returns the clone of the shared linter configuration.
     *
     * @returns The shared linter configuration
     */
    getLinterConfig: () => LinterConfig;

    /**
     * Returns the raw content of the adbock filter list currently processed by the linter.
     *
     * @returns The raw adblock filter list content
     */
    getFilterListContent: () => string;

    /**
     * Returns the AST of the adblock rule currently being iterated by the linter.
     *
     * @returns The actual adblock rule as AST
     */
    getActualAdblockRuleAst: () => AnyRule | undefined;

    /**
     * Returns the raw version of the adblock rule currently being iterated by the linter.
     *
     * @returns The actual adblock rule as original string
     */
    getActualAdblockRuleRaw: () => string | undefined;

    /**
     * Returns the line number that the linter is currently iterating.
     *
     * @returns The actual line number
     */
    getActualLine: () => number;

    /**
     * Returns whether a fix was requested from the linter. This is an optimization
     * for the linter, so it doesn't have to run the fixer if it's not needed.
     *
     * @returns `true` if fix is needed, `false` otherwise
     */
    fixingEnabled: () => boolean;

    /**
     * Storage for storing data between events. This storage is only visible to the rule.
     */
    storage: LinterRuleStorage;

    /**
     * Additional config for the rule. This is unknown at this point, but the concrete
     * type is defined by the rule.
     */
    config: unknown;

    /**
     * Function for reporting problems to the linter.
     *
     * @param problem - The problem to report
     */
    report: (problem: LinterProblemReport) => void;
}

/**
 * Represents a linter rule storage object that is passed as reference to
 * the rules when their events are triggered.
 *
 * Basically used internally by the linter, so no need to export this.
 */
type LinterRuleStorage = {
    // The key is some string, the value is unknown at this point.
    // The concrete value type is defined by the rule.
    [key: string]: unknown;
};

/**
 * Represents a linter rule data object. Basically used internally by the linter,
 * so no need to export this.
 */
interface LinterRuleData {
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
     * @param config - The linter configuration
     */
    constructor(config: LinterConfig = defaultLinterConfig) {
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
     * Sets the linter configuration. If `reset` is set to `true`, all rule
     * configurations are reset to their default values (removing overrides).
     *
     * @param config Core linter configuration
     * @param reset Whether to reset all rule configs
     */
    public setConfig(config: LinterConfig, reset = true): void {
        this.config = config;

        // Reset all rule configs
        if (reset) {
            for (const entry of this.rules.values()) {
                entry.configOverride = undefined;
                entry.severityOverride = undefined;
            }
        }

        if (config.rules) {
            for (const [rule, ruleConfig] of Object.entries(config.rules)) {
                const entry = this.rules.get(rule);

                // Tolerate unknown rules, simply ignore them
                if (entry) {
                    entry.configOverride = ruleConfig;
                }
            }
        }
    }

    /**
     * Adds a new rule to the linter.
     *
     * @param name The name of the rule
     * @param rule The rule itself
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

        if (data.severityOverride) {
            // Validate severity
            if (!isSeverity(data.severityOverride)) {
                throw new Error(`Invalid severity "${data.severityOverride}" for rule "${name}"`);
            }
        }

        if (data.configOverride) {
            if (!data.rule.meta.config) {
                throw new Error(`Rule "${name}" doesn't have any config, but you tried to provide one`);
            } else {
                assert(data.configOverride, data.rule.meta.config.schema);
            }
        }

        // Add rule to the repository
        this.rules.set(name, data);
    }

    /**
     * Sets the config for the rule with the specified name.
     *
     * @param name The name of the rule
     * @param config New config for the rule
     */
    public setRuleConfig(name: string, config: unknown): void {
        // Find the rule
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" doesn't exist`);
        }

        if (!entry.rule.meta.config) {
            throw new Error(`Rule "${name}" doesn't have any config, but you tried to provide one`);
        }

        // Validate config with Superstruct
        assert(config, entry.rule.meta.config.schema);

        // Set the config
        entry.configOverride = config;
    }

    /**
     * Resets default config for the rule with the specified name.
     *
     * @param name The name of the rule
     */
    public resetRuleConfig(name: string): void {
        // Find the rule
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" doesn't exist`);
        }

        if (!entry.rule.meta.config) {
            throw new Error(`Rule "${name}" doesn't have any config`);
        }

        // Set the config to undefined, so the default config will be used
        entry.configOverride = undefined;
    }

    /**
     * Returns the `LinterRule` object with the specified name.
     *
     * @param name - The name of the rule
     * @returns The `LinterRule` object, or `undefined` if no such rule exists
     */
    public getRule(name: string): LinterRule | undefined {
        // Return the rule (if it exists)
        return this.rules.get(name)?.rule;
    }

    /**
     * Returns the map of all rules in the repository.
     *
     * @returns The map of rule names to `LinterRule` objects
     */
    public getRules(): Map<string, LinterRuleData> {
        return this.rules;
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
    }

    /**
     * Enables a rule
     *
     * @param name - The name of the rule
     */
    public enableRule(name: string): void {
        const entry = this.rules.get(name);

        // Check if the rule exists
        if (!entry) {
            throw new Error(`Rule with name "${name}" does not exist`);
        }

        entry.severityOverride = undefined;
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

        const severity = entry.severityOverride || entry.rule.meta.severity;

        return severity === SEVERITY.off;
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
        let actualAdblockRuleAst: AnyRule | undefined = undefined;
        let actualAdblockRuleRaw: string | undefined = undefined;

        /**
         * Invokes an event for all rules. This function is only used internally
         * by the actual linting, so we define it here.
         *
         * The context is dependent on the actual linting environment, so we create
         * a new context object for each event within this function.
         *
         * @param event - The event to invoke (e.g. `onRule`)
         */
        const invokeEvent = (event: keyof LinterRule["events"]): void => {
            for (const [name, data] of this.rules) {
                // If the rule is disabled, skip it
                if (
                    (this.isRuleDisabled(name) || // rule is disabled at config level
                        nextLineDisabled.has(name)) && // or rule is disabled for the next line
                    !nextLineEnabled.has(name) // and rule is not enabled for the next line
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
                        getActualAdblockRuleRaw: () => (actualAdblockRuleRaw ? actualAdblockRuleRaw : undefined),

                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        getActualLine: () => actualLine,

                        fixingEnabled: () => fix,

                        // Storage reference
                        storage: data.storage,

                        // Rule configuration
                        config: data.configOverride || data.rule.meta.config?.default,

                        // Reporter function
                        report: (problem: LinterProblemReport) => {
                            result.problems.push({
                                rule: name,
                                severity: data.rule.meta.severity,
                                message: problem.message,
                                position: { ...problem.position },
                                fix: problem.fix,
                            });

                            // Update problem counts
                            const severity = getSeverity(data.rule.meta.severity);

                            switch (severity) {
                                case SEVERITY.warn:
                                    result.warningCount++;
                                    break;
                                case SEVERITY.error:
                                    result.errorCount++;
                                    break;
                                case SEVERITY.fatal:
                                    result.fatalErrorCount++;
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
        invokeEvent("onStartFilterList");

        // Get lines (rules) of the filter list
        const rules = StringUtils.splitStringByNewLines(content);

        // Iterate over all filter list adblock rules
        rules.forEach((rule, index) => {
            // Update actual line number for the context object
            actualLine = index + 1;

            // Process the line
            const code = ((): number => {
                try {
                    // Parse the current adblock rule, but this throw an error if the rule is invalid.
                    // We catch the error and report it as a problem.
                    const ast = RuleParser.parse(rule);

                    // Handle inline config comments
                    if (ast.category == RuleCategory.Comment && ast.type == CommentRuleType.ConfigComment) {
                        // If inline config is not allowed in the linter configuration,
                        // simply skip the comment processing
                        if (!this.config.allowInlineConfig) {
                            return 0;
                        }

                        // Process the inline config comment
                        switch (ast.command) {
                            case ConfigCommentType.Main: {
                                // TODO: Modify linter config here
                                break;
                            }

                            case ConfigCommentType.Disable: {
                                isDisabled = true;
                                break;
                            }

                            case ConfigCommentType.Enable: {
                                isDisabled = false;
                                break;
                            }

                            case ConfigCommentType.DisableNextLine: {
                                // Disable specific rules for the next line
                                if (ast.params && ArrayUtils.isArrayOfStrings(ast.params)) {
                                    for (const param of ast.params) {
                                        nextLineDisabled.add(param);
                                    }
                                }
                                // Disable all rules for the next line
                                else {
                                    isDisabledForNextLine = true;
                                }

                                break;
                            }

                            case ConfigCommentType.EnableNextLine: {
                                // Enable specific rules for the next line
                                if (ast.params && ArrayUtils.isArrayOfStrings(ast.params)) {
                                    for (const param of ast.params) {
                                        nextLineEnabled.add(param);
                                    }
                                }
                                // Enable all rules for the next line
                                else {
                                    isEnabledForNextLine = true;
                                }

                                break;
                            }
                        }

                        // The config comment has been processed, there is nothing more to do with the line
                        // But we need to return 1, because we processed an inline config comment
                        return 1;
                    } else {
                        // If the linter is actually disabled, skip the rule processing.
                        // It is important to do this check here, because we need to
                        // process the inline config comments even if the linter is disabled
                        // (in this way we could detect the `enable` command, for example).
                        if ((isDisabled || isDisabledForNextLine) && !isEnabledForNextLine) {
                            return 0;
                        }

                        // Deep copy of the line data
                        actualAdblockRuleAst = { ...ast };
                        actualAdblockRuleRaw = rule;

                        // Invoke onRule event for all rules (process actual adblock rule)
                        invokeEvent("onRule");
                    }
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
                                endColumn: rule.length,
                            },
                        });

                        // Don't forget to increase the fatal error count when parsing fails
                        result.fatalErrorCount++;
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
        invokeEvent("onEndFilterList");

        // Build fixed content if fixing is enabled
        if (fix) {
            // Create a new array for the fixed content (later we will join it)
            const fixes: string[] = [];

            // Iterate over all lines in the original content (filter list content)
            for (let i = 0; i < rules.length; i++) {
                let conflict = false;
                let foundFix: AnyRule | AnyRule[] | undefined = undefined;

                // Iterate over all problems and check if the problem is on the current line
                for (const problem of result.problems) {
                    // TODO: Currently we only support fixes for single-line problems
                    if (problem.position.startLine == i + 1 && i + 1 == problem.position.endLine) {
                        // If the problem has a fix, check if there is a conflict.
                        // We can't fix the line if there are multiple fixes for the same line.
                        if (problem.fix) {
                            if (foundFix && foundFix != problem.fix) {
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
                        fixes.push(...foundFix.map((ast) => RuleParser.generate(ast)));
                    }
                    // Otherwise, we can simply push the generated (fixed) rule
                    else {
                        fixes.push(RuleParser.generate(foundFix));
                    }
                } else {
                    // Otherwise, push the original rule
                    fixes.push(rules[i]);
                }
            }

            // Join the fixed rules by newlines
            result.fixed = fixes.join(NEWLINE);
        }

        // Return linting result
        return result;
    }
}
