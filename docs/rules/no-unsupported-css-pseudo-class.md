<!-- markdownlint-disable -->
# `no-unsupported-css-pseudo-class`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Checks that CSS pseudo-classes are supported

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed via suggestions 💡

## Options

This rule can be configured using the following options.

### Options overview

```typescript
[
  {
    fuzzyThreshold: number // Minimum similarity threshold for fuzzy matching
    additionalSupportedCssPseudoClasses?: string[] // Additional supported CSS pseudo-classes | undefined
    additionalSupportedExtCssPseudoClasses?: string[] // Additional supported Extended CSS pseudo-classes | undefined
  }
]
```

### Options valibot schema

<details>
<summary>Click to expand</summary>

```typescript
{
  "kind": "schema",
  "type": "tuple",
  "expects": "Array",
  "async": false,
  "items": [
    {
      "kind": "schema",
      "type": "strict_object",
      "expects": "Object",
      "async": false,
      "entries": {
        "fuzzyThreshold": {
          "kind": "schema",
          "type": "number",
          "expects": "number",
          "async": false,
          "~standard": {
            "version": 1,
            "vendor": "valibot"
          },
          "pipe": [
            {
              "kind": "schema",
              "type": "number",
              "expects": "number",
              "async": false,
              "~standard": {
                "version": 1,
                "vendor": "valibot"
              }
            },
            {
              "kind": "validation",
              "type": "min_value",
              "async": false,
              "expects": ">=0",
              "requirement": 0
            },
            {
              "kind": "validation",
              "type": "max_value",
              "async": false,
              "expects": "<=1",
              "requirement": 1
            },
            {
              "kind": "metadata",
              "type": "description",
              "description": "Minimum similarity threshold for fuzzy matching"
            }
          ]
        },
        "additionalSupportedCssPseudoClasses": {
          "kind": "schema",
          "type": "optional",
          "expects": "(Array | undefined)",
          "async": false,
          "wrapped": {
            "kind": "schema",
            "type": "array",
            "expects": "Array",
            "async": false,
            "item": {
              "kind": "schema",
              "type": "string",
              "expects": "string",
              "async": false,
              "~standard": {
                "version": 1,
                "vendor": "valibot"
              }
            },
            "~standard": {
              "version": 1,
              "vendor": "valibot"
            },
            "pipe": [
              {
                "kind": "schema",
                "type": "array",
                "expects": "Array",
                "async": false,
                "item": {
                  "kind": "schema",
                  "type": "string",
                  "expects": "string",
                  "async": false,
                  "~standard": {
                    "version": 1,
                    "vendor": "valibot"
                  }
                },
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                }
              },
              {
                "kind": "metadata",
                "type": "description",
                "description": "Additional supported CSS pseudo-classes"
              }
            ]
          },
          "~standard": {
            "version": 1,
            "vendor": "valibot"
          }
        },
        "additionalSupportedExtCssPseudoClasses": {
          "kind": "schema",
          "type": "optional",
          "expects": "(Array | undefined)",
          "async": false,
          "wrapped": {
            "kind": "schema",
            "type": "array",
            "expects": "Array",
            "async": false,
            "item": {
              "kind": "schema",
              "type": "string",
              "expects": "string",
              "async": false,
              "~standard": {
                "version": 1,
                "vendor": "valibot"
              }
            },
            "~standard": {
              "version": 1,
              "vendor": "valibot"
            },
            "pipe": [
              {
                "kind": "schema",
                "type": "array",
                "expects": "Array",
                "async": false,
                "item": {
                  "kind": "schema",
                  "type": "string",
                  "expects": "string",
                  "async": false,
                  "~standard": {
                    "version": 1,
                    "vendor": "valibot"
                  }
                },
                "~standard": {
                  "version": 1,
                  "vendor": "valibot"
                }
              },
              {
                "kind": "metadata",
                "type": "description",
                "description": "Additional supported Extended CSS pseudo-classes"
              }
            ]
          },
          "~standard": {
            "version": 1,
            "vendor": "valibot"
          }
        }
      },
      "~standard": {
        "version": 1,
        "vendor": "valibot"
      }
    }
  ],
  "~standard": {
    "version": 1,
    "vendor": "valibot"
  }
}
```

</details>

### Options JSON schema

<details>
<summary>Click to expand</summary>

```typescript
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
#?#*:has(.selector)
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
#?#*:contians(foo)
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
1:4 Unsupported CSS pseudo-class: contians
```

and the following suggestions should be offered:

- Change pseudo-class to contains

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -#?#*:contians(foo)
  +#?#*:contains(foo)
  ```

- Change pseudo-class to -abp-contains

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -#?#*:contians(foo)
  +#?#*:-abp-contains(foo)
  ```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-unsupported-css-pseudo-class.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-unsupported-css-pseudo-class.test.ts
