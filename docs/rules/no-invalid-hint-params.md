<!-- markdownlint-disable -->
# `no-invalid-hint-params`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks if hints are parameterized correctly

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Valid hint parameters

The following code

```adblock
!+ PLATFORM(windows)
```

should not be reported

### Valid hint parameters

The following code

```adblock
!+ NOT_VALIDATE
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Hint with empty parameters

The following code

```adblock
!+ PLATFORM()
```

should be reported as:

```shell
1:3 Hint "PLATFORM" must have at least one platform specified
```

### Hint without parameters

The following code

```adblock
!+ PLATFORM
```

should be reported as:

```shell
1:3 Hint "PLATFORM" must have at least one platform specified
```

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-invalid-hint-params.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-invalid-hint-params.test.ts
