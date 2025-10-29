<!-- markdownlint-disable -->
# `no-duplicated-hint-platforms`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks if a platform is used more than once within the same PLATFORM / NOT_PLATFORM hint

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧

## Correct examples

Examples of correct code:

### No duplicated hint platforms

The following code

```adblock
!+ PLATFORM(windows, mac, ios)
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Duplicated hint platforms

The following code

```adblock
!+ PLATFORM(windows, mac, windows, ios)
```

should be reported as:

```shell
1:26 Duplicated platform "windows"
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,1 @@
-!+ PLATFORM(windows, mac, windows, ios)
+!+ PLATFORM(windows, mac, ios)
```

## Version

This rule was added in AGLint version 1.0.9

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-duplicated-hint-platforms.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-duplicated-hint-platforms.test.ts
