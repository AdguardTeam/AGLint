<!-- markdownlint-disable -->
# `no-invalid-modifiers`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks modifiers validity for basic (network) rules

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Valid `script` and `third-party` modifiers

The following code

```adblock
||example.com^$script,third-party
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid `foo` modifier

The following code

```adblock
||example.com^$foo
```

should be reported as:

```shell
1:15 Invalid modifier: "foo", got "Non-existent modifier: 'foo'"
```

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-invalid-modifiers.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-invalid-modifiers.test.ts
