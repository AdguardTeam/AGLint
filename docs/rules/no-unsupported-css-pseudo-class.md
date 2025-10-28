<!-- markdownlint-disable -->
# no-unsupported-css-pseudo-class

## Description

Checks that CSS pseudo-classes are supported

## Metadata

- Fixable: ❌
- Suggestions: ✅
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
        "fuzzyThreshold": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "default": 0.6
        },
        "additionalSupportedCssPseudoClasses": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": []
        },
        "additionalSupportedExtCssPseudoClasses": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": []
        }
      },
      "required": [],
      "default": {
        "fuzzyThreshold": 0.6,
        "additionalSupportedCssPseudoClasses": [],
        "additionalSupportedExtCssPseudoClasses": []
      }
    }
  ],
  "minItems": 1
}
```

### Default options

```json
[
  {
    "fuzzyThreshold": 0.6,
    "additionalSupportedCssPseudoClasses": [],
    "additionalSupportedExtCssPseudoClasses": []
  }
]
```

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-unsupported-css-pseudo-class.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-unsupported-css-pseudo-class.test.ts

