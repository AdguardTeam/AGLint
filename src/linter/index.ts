/** Linter core */

// External
import ignore, { Ignore } from "ignore";

// Parser
import { Rules } from "./rules";
import { ConfigComment } from "../parser/comment/inline-config";
import { FilterListEntryType, FilterListParser, ValidFilterListEntry } from "../parser/filterlist";
import { RuleCategory } from "../parser/categories";
import { CommentRuleType } from "../parser/comment/types";
import { LinterRule, LinterRuleConfig, LinterRuleEvents, LinterRuleSeverity } from "./rule";

const defaultOptions: LinterOptions = {
    allowInlineConfig: true,
};

export interface LinterOptions {
    allowInlineConfig?: boolean;
    rules?: { [key: string]: LinterRuleConfig };
}

/** Represents currently supported config comments */
export enum ConfigCommentType {
    /** Main config comment with configuration object */
    Main = "aglint",

    /** Disables AGLint until the next enable comment */
    Disable = "aglint-disable",

    /** Enables AGLint */
    Enable = "aglint-enable",

    /** Disables AGLint for next line */
    DisableNextLine = "aglint-disable-next-line",

    /** Enables AGLint for next line */
    EnableNextLine = "aglint-enable-next-line",
}

/** Represents the location of a problem detected by the linter */
export interface LinterPosition {
    /** Start line number */
    startLine: number;

    /** Start column position */
    startColumn?: number;

    /** End line number */
    endLine: number;

    /** End column position */
    endColumn?: number;
}

/** Represents a problem report (this must be passed to context.report from the rules) */
export interface LinterProblemReport {
    /** Text description of the problem */
    message: string;

    position: LinterPosition;

    // TODO
    fix?: unknown;
}

export interface LinterResult {
    messages: LinterProblem[];
    warningCount: number;
    errorCount: number;
    fatalErrorCount: number;
}

/** Represents a message given by the linter */
export interface LinterProblem {
    /** Name of the linter rule that generated this problem */
    rule?: string;

    /** The severity of this problem (it practically inherits the rule severity) */
    severity: LinterRuleSeverity;

    /** Text description of the problem */
    message: string;

    position: LinterPosition;
}

export interface LinterContext {
    /** Get shared linter configuration */
    getLinterOptions: () => LinterOptions;

    /** Get raw adblock filter list content */
    getFilterListContent: () => string;

    /** Get actual adblock rule */
    getActualAdblockRule: () => ValidFilterListEntry;

    /** Rule state storage */
    storage: RuleStorage;

    /** Report a problem to the linter */
    report: (problem: LinterProblemReport) => void;
}

type RuleStorage = { [key: string]: unknown };

interface RuleData {
    rule: LinterRule;
    storage: RuleStorage;
    severity: LinterRuleSeverity;
    parameters?: unknown[];
}

export class Linter {
    /** The linter configuration */
    private options: LinterOptions = defaultOptions;

    /** It stores the ignored paths (the ignore management is delegated to a well-tested external library) */
    private ignore: Ignore = ignore();

    /** All rules are imported at the beginning, and this rule storage handles them */
    private rules: Map<string, RuleData> = new Map(
        Array.from(Rules).map(([name, rule]) => [
            name,
            {
                rule,
                storage: {},
                severity: rule.meta.severity,
            },
        ])
    );

    /** Actually processed filter list */
    private filterListContent = "";

    /** Actually processed adblock rule */
    private actualAdblockRule!: ValidFilterListEntry;

    /** Found problems */
    private problems: LinterProblem[] = [];

    /** Is linter currently disabled? */
    private disabled = false;

    /** Is linter disabled for the next line? */
    private nextLineDisabled = false;

    /** Some rules are disabled for the next line? */
    private nextLineDisabledRules: string[] = [];

    // private nextLineEnabledRules: string[] = [];

    constructor(options: LinterOptions = defaultOptions) {
        this.options = options;

        // TODO Load options

        // Invoke start
        this.invokeRuleEvent("onStart");
    }

    /**
     * With this method, a custom linter rule can be added to the linter
     *
     * @param name - Rule name
     * @param rule - The rule itself
     * @param severity -.Rule severity
     * @param parameters - Additional parameters
     */
    public defineRule(name: string, rule: LinterRule, severity: LinterRuleSeverity, parameters: unknown[] = []) {
        if (this.rules.has(name)) {
            throw new Error("Name already taken");
        }

        this.rules.set(name, {
            rule,
            storage: {},
            severity,
            parameters,
        });
    }

    /**
     * Adds new ignores to the linter (in addition to the existing ones)
     *
     * @param ignores - Ignore list
     */
    public addIgnores(ignores: string[]) {
        this.ignore.add(ignores);
    }

    /**
     * Resets the list of ignores (older ones are lost)
     *
     * @param ignores - Ignore list
     */
    public setIgnores(ignores: string[]) {
        this.ignore = ignore().add(ignores);
    }

    /**
     * Determines whether the specified path is ignored
     *
     * @param filePath - Path for the file
     * @returns true/false
     */
    public isPathIgnored(filePath: string): boolean {
        return this.ignore.ignores(filePath);
    }

    /**
     * Determines if a liter rule is turned off
     *
     * @param name - Rule name
     * @returns true/false
     */
    private isRuleDisabled(name: string): boolean {
        if (this.options.rules) {
            if (this.nextLineDisabledRules.includes(name)) {
                return true;
            }

            if (name in this.options.rules) {
                return this.options.rules[name] === LinterRuleSeverity.Off;
            }
        }

        return false;
    }

    /**
     * Stores a reported problem in the linter
     *
     * @param problem - Problem informations
     */
    private addProblem(problem: LinterProblem) {
        this.problems.push(problem);
    }

    /**
     * Returns the problems detected by the linter
     *
     * @returns Deep copy of problems array
     */
    public getProblems(): LinterProblem[] {
        return [...this.problems];
    }

    /**
     * Calls the specified event in all enabled rules
     *
     * @param event - Event name
     */
    public invokeRuleEvent(event: string & keyof LinterRuleEvents) {
        for (const [name, rule] of this.rules) {
            // Skipping non-existent rules / events
            if (this.isRuleDisabled(name) || !Object.prototype.hasOwnProperty.call(rule.rule.events, event)) {
                continue;
            }

            // Create actual context, and protect it with freezing
            const context: LinterContext = Object.freeze({
                // Deep copy linter config
                getLinterOptions: () => ({ ...this.options }),

                // The whole filter list content
                getFilterListContent: () => this.filterListContent,

                // The currently iterated adblock rule
                getActualAdblockRule: () => this.actualAdblockRule,

                // Storage reference
                storage: rule.storage,

                // Reporter
                report: (data: LinterProblemReport) => {
                    this.addProblem({
                        rule: name,
                        severity: rule.severity,
                        message: data.message,
                        position: { ...data.position },
                    });
                },
            });

            // Invoke rule event with the context
            rule.rule.events[event]?.(context);
        }
    }

    /**
     * Processes a config comment
     *
     * @param ast - Config comment AST
     */
    private processConfigComment(ast: ConfigComment) {
        // If the processing of config comments is disabled in the config, then do nothing
        if (!this.options.allowInlineConfig) {
            return;
        }

        switch (ast.command) {
            case ConfigCommentType.Main: {
                // TODO: Modify linter config here
                break;
            }

            case ConfigCommentType.Disable: {
                this.disabled = true;
                break;
            }

            case ConfigCommentType.Enable: {
                this.disabled = false;
                break;
            }

            case ConfigCommentType.DisableNextLine: {
                if (ast.params && typeof ast.params === "string") {
                    this.nextLineDisabledRules = ast.params;
                } else {
                    this.nextLineDisabled = true;
                }

                break;
            }

            // TODO: Enable next line
        }
    }

    /**
     * Lint a filter list
     *
     * @param content - Filter list content
     */
    public lintFilterList(content: string) {
        this.filterListContent = content;

        // It must be indicated to the rules that processing of the filter list has begun
        this.invokeRuleEvent("onStartFilterList");

        // Parse filter list
        const entries = FilterListParser.parse(content);

        for (const entry of entries) {
            // If an entry (line/rule) is valid, it means that it was successfully parsed
            if (entry.type == FilterListEntryType.ValidEntry) {
                // ALWAYS handle linter config comments (even if disable is in effect)
                if (this.options.allowInlineConfig) {
                    if (entry.ast.category == RuleCategory.Comment && entry.ast.type == CommentRuleType.ConfigComment) {
                        this.processConfigComment(entry.ast);

                        // The config comment has been processed, there is nothing more to do with the line
                        continue;
                    }
                }
            }

            // Handle disables
            if (this.disabled) {
                continue;
            }

            if (this.nextLineDisabled) {
                // Enable linter again, since it was just a temporary disable
                this.nextLineDisabled = false;
                continue;
            }

            if (entry.type == FilterListEntryType.ValidEntry) {
                // Adblock rules processing - run all enabled linter rules
                this.actualAdblockRule = entry;

                this.invokeRuleEvent("onRule");
            }
            // If an entry (line/rule) is invalid, it means that it could not be parsed for some reason. This is a
            // fatal error from the point of view of the linter, since the linter rules can only accept AST.
            else if (entry.type == FilterListEntryType.InvalidEntry) {
                this.addProblem({
                    severity: LinterRuleSeverity.Fatal,
                    message: entry.error.message,
                    position: {
                        startLine: entry.line,
                        startColumn: 0,
                        endLine: entry.line,
                        endColumn: entry.raw.length,
                    },
                });

                // Since the rule is wrong, there is nothing more to do with this line, so let's jump to the next line
                continue;
            }

            // It is important that if there were linter rules turned off for this line, they must be enabled again
            this.nextLineDisabledRules = [];
        }

        // It must be indicated to the rules that the entire filter list has been processed
        this.invokeRuleEvent("onEndFilterList");
    }
}
