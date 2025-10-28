<!-- markdownlint-disable -->
# max-css-selectors

## Description

Checks if a CSS selector list contains more than the specified number of selectors

## Metadata

- Fixable: ✅
- Suggestions: ❌
- Recommended: ❌
- Type: layout

## Options

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": [
    {
      "type": "object",
      "properties": {
        "maxSelectors": {
          "type": "number",
          "default": 1,
          "minimum": 1
        }
      },
      "required": [],
      "additionalProperties": false,
      "default": {
        "maxSelectors": 1
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
    "maxSelectors": 1
  }
]
```

## Examples

### Example 1

```adblock
##.single-selector
```

should not be reported

### Example 2

```adblock
##.selector1, .selector2
```

should be reported as:

```shell
1:2 This selector list contains 2 selectors, but only 1 are allowed
```

and should be fixed as:

```diff
- ##.selector1, .selector2
+ ##.selector1
+ ##.selector2
```
## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/max-css-selectors.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/max-css-selectors.test.ts

