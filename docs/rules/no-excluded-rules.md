<!-- markdownlint-disable -->
# `no-excluded-rules`


## Description

Checks if any rule matches an excluded pattern

## Features

- Some reported problems can be fixed automatically 🔧

## Options

This rule can be configured using the following options:

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

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-excluded-rules.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-excluded-rules.test.ts

