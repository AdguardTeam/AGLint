<!-- markdownlint-disable -->
# `max-css-selectors`


## Description

Checks if a CSS selector list contains more than the specified number of selectors

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
        "maxSelectors": {
          "type": "number",
          "default": 1,
          "minimum": 1,
          "description": "The maximum number of selectors allowed in a selector list"
        }
      },
      "required": [],
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
    "maxSelectors": 1
  }
]
```

## Correct examples

Examples of correct code:

### Single selector

```adblock
##.single-selector
```

with config:

```json
[
  {
    "maxSelectors": 1
  }
]
```

should not be reported

### Multiple selectors

```adblock
##.selector1, .selector2
```

with config:

```json
[
  {
    "maxSelectors": 2
  }
]
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Multiple selectors

```adblock
##.selector1, .selector2
```

with config:

```json
[
  {
    "maxSelectors": 1
  }
]
```

should be reported as:

```shell
1:2 This selector list contains 2 selectors, but only 1 are allowed
```


and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,2 @@
-##.selector1, .selector2
+##.selector1
+##.selector2
```

## Version

This rule was added in AGLint version 1.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/max-css-selectors.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/max-css-selectors.test.ts

