<!-- markdownlint-disable -->
# `no-excluded-rules`

## Description

Checks if any rule matches an excluded pattern

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧

## Options

This rule can be configured using the following options.

### Options schema

<details>
<summary>Click to expand</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": [
    {
      "type": "object",
      "properties": {
        "excludedRuleTexts": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of rule texts to exclude"
        },
        "excludedRegExpPatterns": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of RegExp patterns to exclude"
        }
      },
      "required": [
        "excludedRuleTexts",
        "excludedRegExpPatterns"
      ],
      "additionalProperties": false
    }
  ],
  "minItems": 1
}
```

</details>

### Default options

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": []
  }
]
```

## Correct examples

Examples of correct code:

### No excluded rules

The following code

```adblock
||example.com^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": []
  }
]
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### `||example.com^` rule is excluded

The following code

```adblock
||example.com^
||example.org^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [
      "||example.com^"
    ],
    "excludedRegExpPatterns": []
  }
]
```

should be reported as:

```shell
1:0 Rule matches an excluded rule text: ||example.com^
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,2 +1,1 @@
-||example.com^
 ||example.org^
```

### Rules containing `.org` are excluded

The following code

```adblock
||example.com^
||example.org^
```

with the following rule config:

```json
[
  {
    "excludedRuleTexts": [],
    "excludedRegExpPatterns": [
      "\\.org"
    ]
  }
]
```

should be reported as:

```shell
2:0 Rule matches an excluded pattern: \.org
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,2 +1,1 @@
 ||example.com^
-||example.org^
```

## Version

This rule was added in AGLint version 2.0.10

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-excluded-rules.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-excluded-rules.test.ts
