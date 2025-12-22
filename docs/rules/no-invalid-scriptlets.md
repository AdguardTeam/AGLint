<!-- markdownlint-disable -->
# `no-invalid-scriptlets`

## Description

Checks if scriptlets are valid based on compatibility tables

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

### Valid AdGuard scriptlet call

The following code

```adblock
#%#//scriptlet("set-constant", "foo", "bar")
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

### Valid uBlock Origin scriptlet call

The following code

```adblock
##+js(set.js, foo, bar)
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

### Valid Adblock Plus scriptlet call

The following code

```adblock
#$#override-property-read foo bar
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

### Unknown AdGuard scriptlet

The following code

```adblock
#%#//scriptlet("unknown-scriptlet", "foo", "bar")
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
1:3 Unknown scriptlet 'unknown-scriptlet' for 'Any AdGuard product'
```

and the following suggestions should be offered:

### Unknown uBlock Origin scriptlet

The following code

```adblock
##+js(unknown-scriptlet.js, foo, bar)
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
1:2 Unknown scriptlet 'unknown-scriptlet.js' for 'Any uBlock Origin product'
```

and the following suggestions should be offered:

### Unknown Adblock Plus scriptlet

The following code

```adblock
#$#unknown-scriptlet foo bar
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
1:3 Unknown scriptlet 'unknown-scriptlet' for 'Any AdBlock / Adblock Plus product'
```

and the following suggestions should be offered:

### Required parameters are missing

The following code

```adblock
#%#//scriptlet("set-constant")
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
1:3 Scriptlet 'set-constant' should have parameter 'property'
1:3 Scriptlet 'set-constant' should have parameter 'value'
```

### Parameters are specified for scriptlet that does not accept any

The following code

```adblock
#%#//scriptlet("log-addEventListener", "foo", "bar")
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
1:3 Scriptlet 'log-addEventListener' should not have parameters, but 2 parameters found
```

### Too many parameters specified

The following code

```adblock
#%#//scriptlet("debug-on-property-read", "foo", "bar")
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
1:3 Scriptlet 'debug-on-property-read' has too many parameters, expected maximum 1, got 2
```

### Almost correct scriptlet name, but misspelled

The following code

```adblock
#%#//scriptlet("pardot1.0")
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
1:3 Unknown scriptlet 'pardot1.0' for 'Any AdGuard product'
```

and the following suggestions should be offered:

- Change scriptlet to 'pardot-1.0'

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -#%#//scriptlet("pardot1.0")
  +#%#//scriptlet("pardot-1.0")
  ```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-invalid-scriptlets.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-invalid-scriptlets.test.ts
