<!-- markdownlint-disable -->
# `no-duplicated-css-declaration-props`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Checks for duplicated CSS declaration properties within the same rule block

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧
- Some reported problems can be fixed via suggestions 💡

## Correct examples

Examples of correct code:

### No duplicated CSS properties

The following code

```adblock
#$#body { color: red; }
#$#body { padding: 10px; }
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid CSS declarations (same property, same values)

The following code

```adblock
#$#body { color: red; color: red; }
```

should be reported as:

```shell
1:22 Duplicated CSS property "color"
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,1 @@
-#$#body { color: red; color: red; }
+#$#body { color: red; }
```

### Invalid CSS declarations (same property, different values)

The following code

```adblock
#$#body { color: red; color: blue; }
```

should be reported as:

```shell
1:22 Duplicated CSS property "color"
```

and the following suggestions should be offered:

- Remove first "color" declaration (value: red)

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -#$#body { color: red; color: blue; }
  +#$#body {color: blue; }
  ```

- Remove current "color" declaration (value: blue)

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -#$#body { color: red; color: blue; }
  +#$#body { color: red; }
  ```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-duplicated-css-declaration-props.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-duplicated-css-declaration-props.test.ts
