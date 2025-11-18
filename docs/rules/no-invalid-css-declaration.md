<!-- markdownlint-disable -->
# `no-invalid-css-declaration`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks if CSS declarations are valid

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Valid declarations

The following code

```adblock
#$#body { color: red; }
#$?#body { remove: true; }
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid declarations

The following code

```adblock
#$#body { color: foo; padding: bar; }
```

should be reported as:

```shell
1:17 Invalid value for 'color' property, mismatch with syntax <color>
1:31 Invalid value for 'padding' property, mismatch with syntax <'padding-top'>{1,4}
```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-invalid-css-declaration.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-invalid-css-declaration.test.ts
