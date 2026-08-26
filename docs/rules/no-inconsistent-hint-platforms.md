<!-- markdownlint-disable -->
# `no-inconsistent-hint-platforms`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM() hint at the same time

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### PLATFORM and NOT_PLATFORM hint with different platforms

The following code

```adblock
!+ PLATFORM(windows) NOT_PLATFORM(mac)
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### PLATFORM and NOT_PLATFORM hint with the same platform

The following code

```adblock
!+ PLATFORM(windows) NOT_PLATFORM(windows)
```

should be reported as:

```shell
1:12 Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time
```

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-inconsistent-hint-platforms.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-inconsistent-hint-platforms.test.ts
