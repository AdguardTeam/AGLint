<!-- markdownlint-disable -->
# scriptlet-quotes

## Description

Checks quotes in scriptlet

## Metadata

- Fixable: ✅
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
        "adg": {
          "enum": [
            "none",
            "single",
            "double",
            "backtick"
          ]
        },
        "ubo": {
          "enum": [
            "none",
            "single",
            "double",
            "backtick"
          ]
        },
        "abp": {
          "enum": [
            "none",
            "single",
            "double",
            "backtick"
          ]
        },
        "disallowCurlyQuotes": {
          "type": "boolean"
        }
      },
      "required": [
        "adg",
        "ubo",
        "abp",
        "disallowCurlyQuotes"
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

https://github.com/AdguardTeam/AGLint/src/rules/scriptlet-quotes.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/scriptlet-quotes.test.ts

