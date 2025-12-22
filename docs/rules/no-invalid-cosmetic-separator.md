<!-- markdownlint-disable -->
# `no-invalid-cosmetic-separator`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Validates that rule separator matches selector/declaration capabilities

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧
- Some reported problems can be fixed via suggestions 💡

## Correct examples

Examples of correct code:

### Element hiding with extended selector

The following code

```adblock
#?#div:contains(a)
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Extended selector with native separator

The following code

```adblock
##div:contains(a)
```

should be reported as:

```shell
1:2 Extended CSS is used in selector, replace "##" with "#?#"
```

and the following suggestions should be offered:

- Change separator to "#?#"

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -##div:contains(a)
  +#?#div:contains(a)
  ```

### Extended selector nested in :has() with native separator

The following code

```adblock
##div:has(> table:contains(a))
```

should be reported as:

```shell
1:2 Extended CSS is used in selector, replace "##" with "#?#"
```

and the following suggestions should be offered:

- Change separator to "#?#"

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -##div:has(> table:contains(a))
  +#?#div:has(> table:contains(a))
  ```

### remove:true with native CSS injection separator

The following code

```adblock
#$#a[href^="/bnlink/?bnid="] { remove: true; }
```

should be reported as:

```shell
1:3 Declaration { remove: true; } is allowed only with "#$?#" separator
```

and the following suggestions should be offered:

- Change separator to "#$?#"

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -#$#a[href^="/bnlink/?bnid="] { remove: true; }
  +#$?#a[href^="/bnlink/?bnid="] { remove: true; }
  ```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-invalid-cosmetic-separator.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-invalid-cosmetic-separator.test.ts
