# Writing Linter Rules

This guide explains how to write custom linter rules for AGLint. AGLint uses a visitor pattern similar to ESLint,
where rules register handlers for specific AST node types using CSS-like selectors.

## Table of Contents

- [Rule Structure](#rule-structure)
- [The Rule Definition](#the-rule-definition)
- [Rule Metadata](#rule-metadata)
- [The Context Object](#the-context-object)
- [Writing Visitors with Selectors](#writing-visitors-with-selectors)
- [Reporting Problems](#reporting-problems)
- [Providing Fixes](#providing-fixes)
- [Providing Suggestions](#providing-suggestions)
- [Rule Configuration](#rule-configuration)
- [Complete Examples](#complete-examples)
- [Testing Rules](#testing-rules)
- [Best Practices](#best-practices)

## Rule Structure

A linter rule is defined using the `defineRule` function and consists of two main parts:

1. **`meta`**: Metadata describing the rule
2. **`create`**: A function that returns visitor functions for AST nodes

```typescript
import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        // Rule metadata
    },
    create: (context) => {
        // Return visitor functions
        return {
            // Selector: handler function
        };
    },
});
```

## The Rule Definition

Use the `defineRule` helper function to define rules with type-safe configuration and message handling:

```typescript
import { defineRule, LinterRuleType } from '../linter/rule';
import * as v from 'valibot';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'my-rule-name',
            description: 'Brief description of what the rule does',
            recommended: true,
            url: 'https://github.com/AdguardTeam/AGLint/blob/master/docs/rules/my-rule-name.md',
        },
        messages: {
            myMessageId: 'Error message with {{placeholder}}',
        },
    },
    create: (context) => {
        return {
            // Visitors
        };
    },
});
```

## Rule Metadata

The `meta` object contains information about the rule:

### Required Fields

- **`type`**: One of:
    - `LinterRuleType.Problem` - Identifies code that will cause errors or confusing behavior
    - `LinterRuleType.Suggestion` - Identifies code that could be improved but isn't necessarily wrong
    - `LinterRuleType.Layout` - Concerns formatting and whitespace

- **`docs`**: Documentation object with:
    - `name` - The rule name (kebab-case)
    - `description` - Short description of what the rule checks
    - `recommended` - Whether the rule is enabled in the recommended config
    - `url` - (Optional) Link to full documentation

### Optional Fields

- **`messages`**: Object mapping message IDs to template strings
    - Use `{{placeholder}}` syntax for dynamic values
    - Provides type-safe message references in `context.report()`

- **`hasFix`**: Set to `true` if the rule can automatically fix problems

- **`hasSuggestions`**: Set to `true` if the rule provides manual fix suggestions

- **`configSchema`**: Valibot schema for validating rule options

- **`defaultConfig`**: Default configuration values

- **`correctExamples`**: Array of code examples that should pass

- **`incorrectExamples`**: Array of code examples that should fail

- **`version`**: AGLint version when the rule was added

### Example with Options

```typescript
export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-short-rules',
            description: 'Checks if a rule is too short',
            recommended: true,
        },
        messages: {
            tooShortRule: 'Rule is too short, its length is {{length}}, '
                + 'but at least {{minLength}} characters are required',
        },
        configSchema: v.tuple([
            v.strictObject({
                minLength: v.pipe(
                    v.number(),
                    v.minValue(1),
                    v.description('Minimum rule length'),
                ),
            }),
        ]),
        defaultConfig: [
            {
                minLength: 4,
            },
        ],
    },
    create: (context) => {
        const { minLength } = context.config[0];
        // ... rule implementation
    },
});
```

## The Context Object

The `context` object is passed to the `create` function and provides:

### Properties

- **`id`**: The rule ID (string)
- **`sourceCode`**: `LinterSourceCode` object for accessing the source text and AST
- **`config`**: Typed configuration array based on your `configSchema`
- **`platforms`**: Bitmask of target platforms
- **`platformsByProduct`**: Platform information by product
- **`filePath`**: (Optional) Path to the file being linted
- **`cwd`**: (Optional) Current working directory
- **`debug`**: (Optional) Debug utilities

### Methods

- **`report(problem)`**: Report a linting problem (see [Reporting Problems](#reporting-problems))
- **`getOffsetRangeForNode(node)`**: Get the offset range for an AST node

### Accessing Source Code

The `context.sourceCode` object provides methods to work with the source text:

```typescript
create: (context) => {
    const sourceCode = context.sourceCode;
    
    // Get the full source text
    const text = sourceCode.getText();
    
    // Get the AST
    const ast = sourceCode.getAst();
    
    // Get a specific line
    const line = sourceCode.getLine(1);
    
    // Convert positions
    const position = sourceCode.getPositionFromOffset(10);
    const offset = sourceCode.getOffsetFromPosition({ line: 1, column: 5 });
}
```

## Writing Visitors with Selectors

AGLint uses **esquery** for selecting AST nodes, similar to how CSS selectors work with DOM elements.
The `create` function returns an object mapping selectors to visitor functions.

### Exploring the AST

To understand the structure of the AST and what node types are available, use the **AST Explorer**:

**[https://scripthunter7.github.io/agtree-astexplorer/](https://scripthunter7.github.io/agtree-astexplorer/)**

This interactive tool lets you:

- Input adblock filter rules and see their parsed AST
- Explore node types, properties, and structure
- Test selectors to see which nodes they match
- Understand the hierarchy and relationships between nodes

For example, entering `example.com##.ad` shows you the `ElementHidingRule` node with its children, helping you
write accurate selectors for your rules.

### Basic Node Type Selectors

Target specific node types by name:

```typescript
create: (context) => {
    return {
        // Called when entering a NetworkRule node
        NetworkRule: (node) => {
            // Handle network rules
        },
        
        // Called when entering a ScriptletInjectionRule node
        ScriptletInjectionRule: (node) => {
            // Handle scriptlet injection rules
        },
        
        // Called when entering a Hint node
        Hint: (node) => {
            // Handle hints
        },
    };
}
```

### Exit Handlers

Use `:exit` suffix to handle when leaving a node:

```typescript
create: (context) => {
    return {
        'HintCommentRule': (node) => {
            // Called when entering hint comment
        },
        'HintCommentRule:exit': (node) => {
            // Called when leaving hint comment
        },
    };
}
```

### Descendant Selectors

Select nodes that are descendants of other nodes (like CSS descendant combinator):

```typescript
create: (context) => {
    return {
        // Any Value node inside a ParameterList
        'ParameterList Value': (node) => {
            // Handle parameter values
        },
        
        // ScriptletInjectionRule's ParameterList Values
        'ScriptletInjectionRule ParameterList Value': (node) => {
            // More specific selection
        },
    };
}
```

### Child Selectors

Select direct children only (like CSS `>` combinator):

```typescript
create: (context) => {
    return {
        // Direct child Value of ParameterList only
        'ParameterList > Value': (node) => {
            // Only direct children, not nested deeper
        },
    };
}
```

### Attribute Selectors

Select nodes based on their properties:

```typescript
create: (context) => {
    return {
        // Nodes with specific property values
        '[name="windows"]': (node) => {
            // Nodes where node.name === "windows"
        },
        
        // Nodes that have a property (any value)
        '[exception]': (node) => {
            // Nodes that have an 'exception' property
        },
    };
}
```

### Wildcard Selector

Select all nodes:

```typescript
create: (context) => {
    return {
        '*': (node) => {
            // Called for every node in the AST
        },
    };
}
```

### Complex Selectors

Combine selectors for more specific matching:

```typescript
create: (context) => {
    return {
        // Multiple conditions
        'NetworkRule[exception=true]': (node) => {
            // Network rules that are exceptions
        },
        
        // Complex descendant paths
        'CssInjectionRule SelectorList PseudoClassSelector': (node) => {
            // Pseudo-class selectors in CSS injection rules
        },
    };
}
```

### Common Node Types

Here are some frequently used node types in adblock filter rules:

- **Network Rules**: `NetworkRule`, `HostRule`
- **Cosmetic Rules**: `CssInjectionRule`, `ElementHidingRule`, `ScriptletInjectionRule`, `HtmlFilteringRule`,
  `JsInjectionRule`
- **Comment Rules**: `CommentRule`, `HintCommentRule`, `ConfigCommentRule`, `MetadataCommentRule`,
  `PreProcessorCommentRule`
- **CSS Selectors**: `SelectorList`, `Selector`, `PseudoClassSelector`, `AttributeSelector`
- **Hints**: `Hint`, `HintValue`
- **Others**: `Value`, `ParameterList`, `Modifier`, `ModifierList`

### Helper Functions

AGLint provides helper functions to create visitors for groups of node types:

```typescript
import { 
    createVisitorsForAnyCosmeticRule,
    createVisitorsForAnyNetworkRule,
    createVisitorsForAnyValidRule,
} from '../linter/visitor-creator';

create: (context) => {
    const handler = (node) => {
        // Handle any cosmetic rule
    };
    
    return {
        // Applies to all cosmetic rule types
        ...createVisitorsForAnyCosmeticRule(handler),
    };
}
```

Available helpers:

- `createVisitorsForAnyNetworkRule(handler)` - Network and host rules
- `createVisitorsForAnyCosmeticRule(handler)` - All cosmetic rules
- `createVisitorsForAnyCommentRule(handler)` - All comment rules
- `createVisitorsForAnyValidRule(handler)` - All valid rules
- `createVisitorsForAnyRule(handler)` - All rules including invalid/empty

## Reporting Problems

Use `context.report()` to report linting issues:

### Basic Report

```typescript
context.report({
    node: node,
    messageId: 'myMessageId',
});
```

### With Data Placeholders

```typescript
context.report({
    messageId: 'tooShortRule',
    data: {
        length: actualLength,
        minLength: requiredLength,
    },
    node: node,
});
```

The `data` object values will replace `{{placeholders}}` in your message template.

### Using `messageId` vs Direct `message`

Always prefer `messageId` over direct `message` strings for several reasons:

1. **Centralized messaging** - All messages are defined in one place (`meta.messages`)
2. **Better testability** - Tests can verify the correct `messageId` was used
3. **Consistency** - Ensures consistent wording across similar issues

```typescript
// ✅ Good - Using messageId
context.report({
    messageId: 'tooShortRule',
    data: { length: 3, minLength: 4 },
    node,
});

// ❌ Bad - Direct message string
context.report({
    message: 'Rule is too short',
    node,
});
```

**Note:** If a report contains both `messageId` and `message`, the (direct) `message` takes precedence. The `messageId`
will be ignored in this case. However, you should never provide both in practice—choose one approach and stick with it.

### With Custom Position

```typescript
context.report({
    messageId: 'problem',
    position: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 5 },
    },
});
```

**Note:** If both `node` and `position` are provided in a report, `position` takes precedence. The `node` will be
ignored in this case, and the explicitly provided `position` will be used for the problem location.

## Providing Fixes

If your rule can automatically fix problems, set `meta.hasFix` to `true` and provide a `fix` function:

```typescript
export default defineRule({
    meta: {
        // ...
        hasFix: true,
    },
    create: (context) => {
        return {
            Selector: (node) => {
                context.report({
                    messageId: 'problem',
                    node,
                    fix(fixer) {
                        const range = context.getOffsetRangeForNode(node);
                        if (!range) {
                            return null;
                        }
                        
                        // Replace the text at the range
                        return fixer.replaceWithText(range, 'new text');
                    },
                });
            },
        };
    },
});
```

**Important:** The `hasFix` property is mandatory for fixable rules. If you provide a `fix` function in
`context.report()` without setting `meta.hasFix: true`, the linter will throw an error.

### Fixer Methods

The `fixer` object provides:

- **`replaceWithText(range, text)`**: Replace text at the given offset range
    - `range`: `[start, end]` offset array
    - `text`: New text to insert

Example from `scriptlet-quotes` rule:

```typescript
fix(fixer) {
    const range = context.getOffsetRangeForNode(scriptletArgument);
    if (!range) {
        return null;
    }
    
    const { value } = scriptletArgument;
    const newValue = QuoteUtils.setStringQuoteType(value, expectedQuoteType);
    
    return fixer.replaceWithText(range, newValue);
}
```

## Providing Suggestions

Suggestions are manual fixes that users can choose to apply. Set `meta.hasSuggestions` to `true`:

```typescript
export default defineRule({
    meta: {
        // ...
        hasSuggestions: true,
        messages: {
            unsupportedPseudoClass: 'Unsupported CSS pseudo-class: {{pseudoClass}}',
            changePseudoClass: 'Change pseudo-class to {{suggestedPseudoClass}}',
        },
    },
    create: (context) => {
        return {
            PseudoClassSelector: (node) => {
                const possibleMatches = ['has', 'contains', 'matches-css'];
                
                context.report({
                    messageId: 'unsupportedPseudoClass',
                    data: { pseudoClass: node.name },
                    node,
                    suggest: possibleMatches.map((match) => ({
                        messageId: 'changePseudoClass',
                        data: { suggestedPseudoClass: match },
                        fix(fixer) {
                            const start = node.loc.start.offset + 1; // +1 for ':'
                            const range = [start, start + node.name.length];
                            return fixer.replaceWithText(range, match);
                        },
                    })),
                });
            },
        };
    },
});
```

**Important:** The `hasSuggestions` property is mandatory for rules that provide suggestions. If you provide a
`suggest` array in `context.report()` without setting `meta.hasSuggestions: true`, the linter will throw an error.

## Rule Configuration

Use Valibot schemas to define and validate rule options:

```typescript
import * as v from 'valibot';

export default defineRule({
    meta: {
        configSchema: v.tuple([
            v.strictObject({
                // String option
                mode: v.enum(['strict', 'loose']),
                
                // Number with constraints
                threshold: v.pipe(
                    v.number(),
                    v.minValue(0),
                    v.maxValue(100),
                ),
                
                // Optional array
                exclude: v.optional(v.array(v.string())),
                
                // Boolean flag
                checkComments: v.boolean(),
            }),
        ]),
        defaultConfig: [
            {
                mode: 'strict',
                threshold: 80,
                checkComments: true,
            },
        ],
    },
    create: (context) => {
        // Access typed configuration
        const { mode, threshold, exclude, checkComments } = context.config[0];
        
        // Use configuration in your rule logic
        return {
            // ...
        };
    },
});
```

## Complete Examples

### Simple Rule Without Configuration

```typescript
import { type Hint } from '@adguard/agtree';
import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-duplicated-hints',
            description: 'Checks if hints are duplicated within the same hint comment rule',
            recommended: true,
        },
        messages: {
            duplicatedHints: 'Duplicated hint "{{hint}}"',
        },
    },
    create: (context) => {
        const history = new Set<string>();
        
        return {
            'HintCommentRule:exit': () => {
                // Clear history when exiting a hint comment
                history.clear();
            },
            
            Hint: (node: Hint) => {
                const name = node.name.value.toLowerCase();
                
                if (history.has(name)) {
                    context.report({
                        messageId: 'duplicatedHints',
                        data: { hint: node.name.value },
                        node,
                    });
                } else {
                    history.add(name);
                }
            },
        };
    },
});
```

### Rule With Configuration and Fix

```typescript
import { type AnyCosmeticRule, type AnyNetworkRule } from '@adguard/agtree';
import * as v from 'valibot';
import { defineRule, LinterRuleType } from '../linter/rule';
import { createVisitorsForAnyCosmeticRule, createVisitorsForAnyNetworkRule } from '../linter/visitor-creator';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-short-rules',
            description: 'Checks if a rule is too short',
            recommended: true,
        },
        messages: {
            tooShortRule: 'Rule is too short, its length is {{length}}, '
                + 'but at least {{minLength}} characters are required',
        },
        configSchema: v.tuple([
            v.strictObject({
                minLength: v.pipe(
                    v.number(),
                    v.minValue(1),
                    v.description('Minimum rule length'),
                ),
            }),
        ]),
        defaultConfig: [{ minLength: 4 }],
    },
    create: (context) => {
        const { minLength } = context.config[0];
        
        const handler = (node: AnyCosmeticRule | AnyNetworkRule) => {
            const sourceText = node.raws?.text;
            if (!sourceText) {
                return;
            }
            
            const ruleTextTrimmed = sourceText.trim();
            
            if (ruleTextTrimmed.length < minLength) {
                context.report({
                    messageId: 'tooShortRule',
                    data: {
                        length: ruleTextTrimmed.length,
                        minLength,
                    },
                    node,
                });
            }
        };
        
        return {
            ...createVisitorsForAnyNetworkRule(handler),
            ...createVisitorsForAnyCosmeticRule(handler),
        };
    },
});
```

### Complex Rule With Suggestions

```typescript
import { type PseudoClassSelectorPlain } from '@adguard/ecss-tree';
import { search } from 'fast-fuzzy';
import * as v from 'valibot';
import { defineRule, LinterRuleType } from '../linter/rule';
import { type LinterOffsetRange } from '../linter/source-code/source-code';

const SUPPORTED_PSEUDO_CLASSES = new Set([
    'has', 'contains', 'matches-css', 'matches-attr', 'xpath',
]);

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unsupported-pseudo-class',
            description: 'Checks that CSS pseudo-classes are supported',
            recommended: true,
        },
        messages: {
            unsupportedPseudoClass: 'Unsupported CSS pseudo-class: {{pseudoClass}}',
            changePseudoClass: 'Change pseudo-class to {{suggestedPseudoClass}}',
        },
        configSchema: v.tuple([
            v.strictObject({
                fuzzyThreshold: v.pipe(
                    v.number(),
                    v.minValue(0),
                    v.maxValue(1),
                ),
            }),
        ]),
        defaultConfig: [{ fuzzyThreshold: 0.6 }],
        hasSuggestions: true,
    },
    create: (context) => {
        const { fuzzyThreshold } = context.config[0];
        const supportedList = [...SUPPORTED_PSEUDO_CLASSES];
        
        return {
            PseudoClassSelector: (node: PseudoClassSelectorPlain) => {
                if (SUPPORTED_PSEUDO_CLASSES.has(node.name)) {
                    return;
                }
                
                // Find similar pseudo-classes using fuzzy matching
                const possibleMatches = search(node.name, supportedList, {
                    threshold: fuzzyThreshold,
                });
                
                context.report({
                    messageId: 'unsupportedPseudoClass',
                    data: { pseudoClass: node.name },
                    node,
                    suggest: possibleMatches.map((match) => ({
                        messageId: 'changePseudoClass',
                        data: { suggestedPseudoClass: match },
                        fix(fixer) {
                            // +1 to skip the ':' character
                            const start = node.loc!.start.offset + 1;
                            const range: LinterOffsetRange = [
                                start,
                                start + node.name.length,
                            ];
                            return fixer.replaceWithText(range, match);
                        },
                    })),
                });
            },
        };
    },
});
```

## Testing Rules

AGLint uses Vitest for testing. Create a test file in the `test/rules/` directory.

### Using the Helper Function

The easiest way is to use the `lint` helper function from `test/rules/helpers/lint`:

```typescript
import { describe, expect, test } from 'vitest';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';
import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-short-rules': [LinterRuleSeverity.Error, { minLength: 4 }],
};

describe('no-short-rules', () => {
    describe('should ignore non-problematic cases', () => {
        test.each([
            'example.com##.ad',
            '||example.com^$script,third-party',
        ])("'%s'", async (rule) => {
            expect((await lint(rule, rulesConfig)).problems).toStrictEqual([]);
        });
    });

    describe('should detect problematic cases', () => {
        test('reports too short rules', async () => {
            const result = await lint('||a', rulesConfig);
            
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0].ruleId).toBe('no-short-rules');
            expect(result.problems[0].message).toContain('too short');
        });
        
        test('includes correct position and data', async () => {
            const result = await lint('aaa', rulesConfig);
            
            expect(result.problems).toStrictEqual([{
                category: 'problem',
                ruleId: 'no-short-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'tooShortRule',
                data: {
                    length: 3,
                    minLength: 4,
                },
                message: 'Rule is too short, its length is 3, but at least 4 characters are required',
                position: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 3 },
                },
            }]);
        });
    });
});
```

### Using the `lint` Function Directly

You can also use the `lint` function from `src/linter/linter` directly:

```typescript
import { describe, expect, test } from 'vitest';
import { lint } from '../../src/linter/linter';
import { LinterRuleSeverity } from '../../src/linter/rule';

describe('my-rule-name', () => {
    const ruleLoader = async (ruleName: string) => {
        return (await import(`../../src/rules/${ruleName}`)).default;
    };

    test('should pass for valid code', async () => {
        const result = await lint({
            fileProps: {
                content: '||example.com^',
            },
            config: {
                rules: {
                    'my-rule-name': [LinterRuleSeverity.Error],
                },
            },
            loadRule: ruleLoader,
        });
        
        expect(result.problems).toHaveLength(0);
    });
    
    test('should report problems for invalid code', async () => {
        const result = await lint({
            fileProps: {
                content: '||a',
            },
            config: {
                rules: {
                    'my-rule-name': [LinterRuleSeverity.Error, { minLength: 4 }],
                },
            },
            loadRule: ruleLoader,
        });
        
        expect(result.problems).toHaveLength(1);
        expect(result.problems[0].message).toContain('too short');
    });
});
```

### Testing Fixes

Use the `lintWithFixes` helper to test automatic fixes:

```typescript
import { lintWithFixes } from './helpers/lint';

test('should apply fixes', async () => {
    const result = await lintWithFixes(
        '#%#//scriptlet(\'name\', \'arg\')',
        { 'scriptlet-quotes': [LinterRuleSeverity.Error] },
    );
    
    expect(result.fixed).toBe(true);
    expect(result.output).toBe('#%#//scriptlet("name", "arg")');
});
```

## Best Practices

### 1. Use Type-Safe Messages

Define messages in `meta.messages` and use `messageId` instead of inline strings:

```typescript
// ✅ Good
meta: {
    messages: {
        tooShort: 'Rule is too short',
    },
},
create: (context) => {
    context.report({ messageId: 'tooShort', node });
}

// ❌ Bad
create: (context) => {
    context.report({ message: 'Rule is too short', node });
}
```

### 2. Provide Clear Error Messages

Use descriptive messages with helpful context:

```typescript
// ✅ Good
'Rule is too short, its length is {{length}}, but at least {{minLength}} characters are required'

// ❌ Bad
'Too short'
```

### 3. Use Specific Selectors

Be as specific as possible to avoid unnecessary visitor calls:

```typescript
// ✅ Good - Only visits Value nodes in ParameterList
'ParameterList > Value': (node) => { },

// ❌ Bad - Visits all Value nodes everywhere
'Value': (node) => { },
```

### 4. Clean Up State

Always clean up state in exit handlers to avoid memory leaks:

```typescript
create: (context) => {
    const cache = new Set();
    
    return {
        'HintCommentRule': (node) => {
            // Use cache
        },
        'HintCommentRule:exit': () => {
            cache.clear(); // ✅ Clean up
        },
    };
}
```

### 5. Handle Edge Cases

Always check for null/undefined before accessing properties:

```typescript
const handler = (node) => {
    const sourceText = node.raws?.text; // ✅ Optional chaining
    if (!sourceText) {
        return; // ✅ Early return
    }
    
    // Process sourceText
};
```

### 6. Validate Configuration

Use Valibot schemas to ensure valid configuration:

```typescript
configSchema: v.tuple([
    v.strictObject({
        threshold: v.pipe(
            v.number(),
            v.minValue(0),    // ✅ Enforce constraints
            v.maxValue(100),
        ),
    }),
]),
```

### 7. Provide Good Documentation

Include `correctExamples` and `incorrectExamples` in metadata:

```typescript
meta: {
    correctExamples: [
        {
            name: 'Valid rule',
            code: '||example.com^',
        },
    ],
    incorrectExamples: [
        {
            name: 'Too short',
            code: '||a',
        },
    ],
}
```

### 8. Use Helper Functions

Leverage visitor creator helpers for common patterns:

```typescript
import { createVisitorsForAnyCosmeticRule } from '../linter/visitor-creator';

// ✅ Good - Covers all cosmetic rule types
return {
    ...createVisitorsForAnyCosmeticRule(handler),
};

// ❌ Bad - Easy to miss a type
return {
    CssInjectionRule: handler,
    ElementHidingRule: handler,
    ScriptletInjectionRule: handler,
    // Forgot HtmlFilteringRule and JsInjectionRule!
};
```

### 9. Return `null` for Unfixable Issues

If a fix cannot be applied safely, return `null`:

```typescript
fix(fixer) {
    const range = context.getOffsetRangeForNode(node);
    if (!range) {
        return null; // ✅ Cannot fix without valid range
    }
    
    return fixer.replaceWithText(range, newText);
}
```

### 10. Test Thoroughly

Test various scenarios:

- Valid code that should pass
- Invalid code that should fail
- Edge cases (empty strings, special characters, etc.)
- Configuration variations
- Fix behavior (if applicable)

### 11. Update Rule Metadata and Documentation

After creating or modifying a rule, run the `rules:update` script to regenerate metadata and documentation:

```bash
pnpm run rules:update
```

This script executes three tasks:

- **generate-rule-exports.ts** - Updates rule exports for the package
- **generate-rules-readme.ts** - Regenerates the rules documentation with up-to-date information
- **generate-presets.ts** - Updates preset configurations (e.g., recommended rules)

Running this script ensures that rule documentation, exports, and presets stay synchronized with your rule
implementation.

## Additional Resources

- [AGTree AST Explorer](https://scripthunter7.github.io/agtree-astexplorer/) - Interactive tool to explore AST structure
- [AGLint Rule Source Code](https://github.com/AdguardTeam/AGLint/tree/master/src/rules)
- [AGLint Test Cases](https://github.com/AdguardTeam/AGLint/tree/master/test/rules)
- [AGTree AST Documentation](https://github.com/AdguardTeam/AGTree)
- [esquery Documentation](https://github.com/estools/esquery)
- [Valibot Documentation](https://valibot.dev/)
