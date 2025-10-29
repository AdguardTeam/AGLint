<!-- markdownlint-disable -->
# `no-short-rules`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks if a rule is too short

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
        "minLength": {
          "type": "number",
          "minimum": 1,
          "description": "Minimum rule length"
        }
      },
      "required": [
        "minLength"
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
    "minLength": 4
  }
]
```

## Correct examples

Examples of correct code:

### Long enough rule

The following code

```adblock
||example.com^
```

with the following rule config:

```json
[
  {
    "minLength": 4
  }
]
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Too short rule

The following code

```adblock
||a
```

with the following rule config:

```json
[
  {
    "minLength": 4
  }
]
```

should be reported as:

```shell
1:0 Rule is too short, its length is 3, but at least 4 characters are required
```

## Version

This rule was added in AGLint version 2.0.3

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-short-rules.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-short-rules.test.ts
