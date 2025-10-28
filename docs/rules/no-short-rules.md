<!-- markdownlint-disable -->
# no-short-rules

## Description

Checks if a rule is too short

## Metadata

- Fixable: ❌
- Suggestions: ❌
- Recommended: ✅
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
        "minLength": {
          "type": "number",
          "minimum": 1
        }
      },
      "required": [
        "minLength"
      ]
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

https://github.com/AdguardTeam/AGLint/src/rules/no-short-rules.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-short-rules.test.ts

