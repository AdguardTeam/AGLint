<!-- markdownlint-disable -->
# `if-directive-balance`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks if conditional preprocessor directives are structured correctly

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧

## Correct examples

Examples of correct code:

### Correct example

The following code

```adblock
!#if adguard
adguard-rule
!#endif
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Unclosed if

The following code

```adblock
!#if adguard
adguard-rule
```

should be reported as:

```shell
1:0 Unclosed "if" directive
```

### Missing if

The following code

```adblock
!#endif
```

should be reported as:

```shell
1:0 Using an "endif" directive without an opening "if" directive
```

### Else without if

The following code

```adblock
!#else
```

should be reported as:

```shell
1:0 Using an "else" directive without an opening "if" directive
```

### Else with params

The following code

```adblock
!#if adguard
adguard-rule
!#else ext_ublock
ublock-rule
!#endif
```

should be reported as:

```shell
3:0 Invalid usage of preprocessor directive: "else"
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,5 +1,5 @@
 !#if adguard
 adguard-rule
-!#else ext_ublock
+!#else
 ublock-rule
 !#endif
```

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/if-directive-balance.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/if-directive-balance.test.ts
