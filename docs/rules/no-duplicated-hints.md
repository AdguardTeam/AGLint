<!-- markdownlint-disable -->
# `no-duplicated-hints`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Checks if hints are duplicated within the same hint comment rule

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### PLATFORM hint with single parameter

The following code

```adblock
!+ PLATFORM(windows)
```

should not be reported

### PLATFORM hint with multiple parameters

The following code

```adblock
!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera)
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Duplicated hint "windows"

The following code

```adblock
!+ PLATFORM(windows, mac, windows, ios) PLATFORM(windows)
```

should be reported as:

```shell
1:40 Duplicated hint "PLATFORM"
```

### Duplicated hint "NOT_OPTIMIZED"

The following code

```adblock
!+ NOT_OPTIMIZED NOT_OPTIMIZED PLATFORM(windows)
```

should be reported as:

```shell
1:17 Duplicated hint "NOT_OPTIMIZED"
```

## Version

This rule was added in AGLint version 1.0.9

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-duplicated-hints.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-duplicated-hints.test.ts
