<!-- markdownlint-disable -->
# `max-css-selectors`


## Description

Checks if a CSS selector list contains more than the specified number of selectors

## Features

- Some reported problems can be fixed automatically 🔧

## Correct examples

Examples of correct code:

### Single selector

```adblock
##.single-selector
```

should not be reported

### Multiple selectors

```adblock
##.selector1, .selector2
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Multiple selectors

```adblock
##.selector1, .selector2
```

should be reported as:

```shell
1:2 This selector list contains 2 selectors, but only 1 are allowed
```


and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,2 @@
-##.selector1, .selector2
+##.selector1
+##.selector2
```

## Version

This rule was added in AGLint version 1.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/max-css-selectors.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/max-css-selectors.test.ts

