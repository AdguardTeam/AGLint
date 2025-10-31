<!-- markdownlint-disable -->
# `no-unknown-hints`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks if hints are known

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Valid hint name

The following code

```adblock
!+ NOT_OPTIMIZED
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid hint name

The following code

```adblock
!+ NOT_FOO
```

should be reported as:

```shell
1:3 Unknown hint name "NOT_FOO"
```

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-unknown-hints.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-unknown-hints.test.ts
