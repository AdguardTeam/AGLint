<!-- markdownlint-disable -->
# `scriptlet-quotes`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks quotes in scriptlet

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧

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
    "adg": "double",
    "ubo": "double",
    "abp": "double",
    "disallowCurlyQuotes": true
  }
]
```

## Correct examples

Examples of correct code:

### Correct quotes

The following code

```adblock
#%#//scriptlet("scriptlet-name", "arg1", "arg2")
```

with the following rule config:

```json
[
  {
    "adg": "double",
    "ubo": "double",
    "abp": "double",
    "disallowCurlyQuotes": true
  }
]
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Single quotes instead of double quotes

The following code

```adblock
#%#//scriptlet('scriptlet-name', 'arg1', 'arg2')
```

with the following rule config:

```json
[
  {
    "adg": "double",
    "ubo": "double",
    "abp": "double",
    "disallowCurlyQuotes": true
  }
]
```

should be reported as:

```shell
1:15 Scriptlet argument should be quoted with double, but single was found
1:33 Scriptlet argument should be quoted with double, but single was found
1:41 Scriptlet argument should be quoted with double, but single was found
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,1 @@
-#%#//scriptlet('scriptlet-name', 'arg1', 'arg2')
+#%#//scriptlet("scriptlet-name", "arg1", "arg2")
```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/scriptlet-quotes.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/scriptlet-quotes.test.ts
