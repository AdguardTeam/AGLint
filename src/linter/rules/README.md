# AGLint rules

In this folder you can find the rules that AGLint uses to check the correctness of the filters.

Table of Contents:
- [AGLint rules](#aglint-rules)
  - [List of current rules](#list-of-current-rules)
  - [How to add a new rule](#how-to-add-a-new-rule)
  - [Creating a new rule](#creating-a-new-rule)
    - [Using rule storage](#using-rule-storage)
    - [Using parameters](#using-parameters)
    - [Report problems](#report-problems)
      - [Suggest a fix](#suggest-a-fix)

## List of current rules

We collect the list of current rules in the main [README.md](../../../README.md#linter-rules) file.

## How to add a new rule

In this section we will explain how to add a new rule to AGLint. This chapter is intended for developers who want to contribute to the project.

1. Create your rule, see details in [Creating a new rule](#creating-a-new-rule) section.
2. Add your rule to the `rules` array in the `src/linter/rules/index.ts` file.
3. Write comprehensive tests for your rule. You can find good examples in the `test/linter/rules` folder.
4. Add your rule to the list of current rules in the main [README.md](../../../README.md#linter-rules) file with a short description and examples.

## Creating a new rule

In order to create a new rule you need to create a new TypeScript file in this folder. For example `rule-name.ts`. The file must export an object which implements the `LinterRule` interface. Basically it means linter events:
```typescript
import { LinterContext } from "../index";
import { LinterRule } from "../rule";
import { AnyRule } from "../../parser";

// Export the rule
export const RuleName = <LinterRule>{
    onStartFilterList: (context: Context) => {
        // Do something in the event...
    },
    onRule: (context: Context) => {
        // Get currently iterated rule as AST (abstract syntax tree). Linter uses the 
        // built-in parser, so it automatically parses the rule into an AST, if possible.
        // If the rule cannot be parsed, the linter will throw a fatal error and this
        // event will not be called.
        // Please note that the AST can be undefined (mainly in onFilterListStart /
        // onEndFilterList events, since there are no concrete rules in these events).
        const ast = <AnyRule>context.getActualAdblockRuleAst();

        // Get currently iterated rule as raw text
        const raw = <string>context.getActualAdblockRuleRaw();

        // Get current line number
        const line = context.getActualLine();

        // Do something in the event with these informations...
    },
    onEndFilterList: (context: Context) => {
        // Do something in the event...
    },
}
```

### Using rule storage

Sometimes you need to store some data between events. In order to do that you can use the "rule storage" in the context object. Each rule has its own storage object, so you can store data without worrying about other rules, `a` rule cannot access the storage of `b` rule, so the collision is not possible.

To make the rule storage type safe you need to define a type for the storage object in your rule file:
```typescript
import { LinterContext } from "../index";
import { LinterRule } from "../rule";

// Define rule storage type (it is only relevant for the rule itself)
interface RuleStorage {
    n: number;
}

// Merge the original context type (LinterContext) with your custom rule
// storage type (RuleStorage)
type RuleContext = LinterContext & {
    storage: RuleStorage;
};

// Export the rule
export const RuleName = <LinterRule>{
    // Use the concretized type (and not the generic one)
    onStartFilterList: (context: RuleContext) => {
        // Initialize the storage (currently it is undefined)
        // Of course, if you want, you can use more complex data structures :)
        context.storage.n = 0;

        // Do something else in the event...
    },
    onRule: (context: RuleContext) => {
        // Its value is 0 (because we initialized it in the previous event)
        context.storage.n++;
        // Its value is 1 (because we incremented it in the previous line)

        // Do something else in the event...
    },
    // ...
}
```

### Using parameters

Sometimes you need to pass some parameters to the rule. In order to do that you can use the `parameters` property of the context object. Similar to the rule storage, its type is unknown for the core, so you need to define it in your rule file:
```typescript
import { LinterContext } from "../index";
import { LinterRule } from "../rule";

// Define rule options type (it is only relevant for the rule itself)
type RuleOptions = [number, string];

// Merge the original context type (LinterContext) with your custom rule
// options type (RuleOptions)
type RuleContext = LinterContext & {
    options: RuleOptions;
};

// Export the rule
export const RuleName = <LinterRule>{
    onRule: (context: RuleContext) => {
        // Get the first parameter (number)
        const firstParameter = context.options[0];

        // Get the second parameter (string)
        const secondParameter = context.options[1];

        // Do something else in the event with the parameters...
    },
    // ...
}
```

*Note: of course you can use both the rule storage and the parameters at the same time.*

### Report problems

In order to report a problem you need to use the `report` method of the context object:
```typescript
import { LinterContext } from "../index";
import { LinterRule } from "../rule";

// Export the rule
export const RuleName = <LinterRule>{
    onRule: (context: LinterContext) => {
        // Get currently iterated rule as raw text
        const raw = <string>context.getActualAdblockRuleRaw();

        // Get the current line number
        const line = context.getActualLine();

        // Report a problem
        context.report({
            // The position of the problem (in most cases it only affects
            // just one line, since adblock rules are one-line rules)
            position: {
                startLine: line,
                startColumn: 0,
                endLine: line,
                endColumn: raw.length,
            },

            // The problem message
            message: "Problem message",
        });
    },
    // ...
}
```

The problem severity automatically depends on the rule severity. If the rule severity is `error` then the problem severity is `error`, if the rule severity is `warning` then the problem severity is `warning`.

#### Suggest a fix

If possible, you can suggest a fix for the problem. In order to do that you need to use the `fix` property of the `report` method:

```typescript
import { LinterContext } from "../index";
import { LinterRule } from "../rule";

// Export the rule
export const RuleName = <LinterRule>{
    onRule: (context: LinterContext) => {
        // Get currently iterated rule as AST (abstract syntax tree)
        const ast = <AnyRule>context.getActualAdblockRuleAst();

        // Get currently iterated rule as raw text
        const raw = <string>context.getActualAdblockRuleRaw();

        // Get the current line number
        const line = context.getActualLine();

        // Detect some problem
        if (...) {
            // Common problem report
            const report = <LinterProblemReport>{
                // The position of the problem
                position: {
                    startLine: line,
                    startColumn: 0,
                    endLine: line,
                    endColumn: raw.length,
                },

                // The problem message
                message: "Problem message",
            };

            // It makes sense to suggest a fix only if the fixing is enabled, so
            // we need to check it first (in order to avoid unnecessary work, because
            // the linter will not use the fix anyway, and it will be a waste of time).
            if (context.fixingEnabled()) {
                // Do something with the AST...
                ast.something = ...;

                // Suggest a fix (fix can be a rule AST, or an array of rule ASTs). If you
                // specify an array of rule ASTs, then the linter will replace the original
                // rule with the first rule AST, and will insert the other rule ASTs after
                // the original rule.
                report.fix = ast;
            } else {
                // Simply report the problem without suggesting a fix
                context.report(report);
            }
        }
    },
    // ...
}
```

*Note: if multiple fixes are suggested for the same problem, then the linter will ignore all of them in order to avoid conflicts.*
