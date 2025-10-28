<!-- markdownlint-disable -->
# no-excluded-rules

## Description

Checks if any rule matches an excluded pattern

## Metadata

- Fixable: ✅
- Suggestions: ❌
- Recommended: ❌
- Type: problem

## Options

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
          }
        },
        "excludedRegExpPatterns": {
          "type": "array",
          "items": {
            "type": "string"
          }
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

### Default options

```json
[
  {}
]
```

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-excluded-rules.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-excluded-rules.test.ts

