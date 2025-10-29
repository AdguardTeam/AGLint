<!-- markdownlint-disable -->
# `no-unsupported-css-pseudo-class`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks that CSS pseudo-classes are supported

## Automatic issue fixing

- Some reported problems can be fixed via suggestions 💡

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
        "fuzzyThreshold": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Minimum similarity threshold for fuzzy matching"
        },
        "additionalSupportedCssPseudoClasses": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Additional supported CSS pseudo-classes"
        },
        "additionalSupportedExtCssPseudoClasses": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Additional supported Extended CSS pseudo-classes"
        }
      },
      "required": [
        "fuzzyThreshold"
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
    "fuzzyThreshold": 0.6
  }
]
```

## Correct examples

Examples of correct code:

### Known pseudo-class

The following code

```adblock
##*:has(.selector)
```

with the following rule config:

```json
[
  {
    "fuzzyThreshold": 0.6
  }
]
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Almost correct pseudo-class, but misspelled

The following code

```adblock
##*:contians(foo)
```

with the following rule config:

```json
[
  {
    "fuzzyThreshold": 0.6
  }
]
```

should be reported as:

```shell
1:3 Unsupported CSS pseudo-class: contians
```

and should offer the following suggestions:

- Change pseudo-class to contains

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -##*:contians(foo)
  +##*:contains(foo)
  ```

- Change pseudo-class to -abp-contains

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -##*:contians(foo)
  +##*:-abp-contains(foo)
  ```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-unsupported-css-pseudo-class.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-unsupported-css-pseudo-class.test.ts
