<!-- markdownlint-disable -->
# `no-unknown-preprocessor-directives`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Checks if a preprocessor directive is known

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Valid preprocessor directive

The following code

```adblock
!#if (conditions_2)
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid preprocessor directive

The following code

```adblock
!#if2 (conditions_2)
```

should be reported as:

```shell
1:0 Unknown preprocessor directive "if2"
```

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-unknown-preprocessor-directives.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-unknown-preprocessor-directives.test.ts
