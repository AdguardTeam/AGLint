<!-- markdownlint-disable -->
# `no-invalid-domains`

> 
> ✅ Using `aglint:recommended` preset will enable this rule
> 

## Description

Disallows invalid domains

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Automatic issue fixing

- Some reported problems can be fixed via suggestions 💡

## Correct examples

Examples of correct code:

### Valid domains

The following code

```adblock
example.*##.ad
pelda.hu##.ad
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Invalid domain

The following code

```adblock
example. com##.ad
```

should be reported as:

```shell
1:0 Invalid domain "example. com"
```

and the following suggestions should be offered:

- Remove invalid domain "example. com"

  ```diff
  ===================================================================
  --- original
  +++ fixed
  @@ -1,1 +1,1 @@
  -example. com##.ad
  +##.ad
  ```

## Version

This rule was added in AGLint version 1.0.9

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-invalid-domains.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-invalid-domains.test.ts
