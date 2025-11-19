<!-- markdownlint-disable -->
# `no-unknown-hint-platforms`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Checks if platforms in related hints are known

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Valid platform

The following code

```adblock
!+ PLATFORM(windows)
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid platform

The following code

```adblock
!+ PLATFORM(foo)
```

should be reported as:

```shell
1:12 Unknown platform "foo"
```

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-unknown-hint-platforms.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-unknown-hint-platforms.test.ts
