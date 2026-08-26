<!-- markdownlint-disable -->
# `no-css-comments`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Disallows CSS comments

## Type

Layout. Focuses on how filters look, not how they work.

## Automatic issue fixing

- Some reported problems can be fixed automatically 🔧

## Correct examples

Examples of correct code:

### No CSS comments

The following code

```adblock
##.ad
#$#body { padding: 10px; }
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### CSS comments in the selector list

The following code

```adblock
##.ad /* comment */
```

should be reported as:

```shell
1:6 CSS comments are not allowed
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,1 @@
-##.ad /* comment */
+##.ad 
```

### CSS comments in the declaration list

The following code

```adblock
#$#body { color: red; /* comment */ color: blue; }
```

should be reported as:

```shell
1:22 CSS comments are not allowed
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,1 @@
-#$#body { color: red; /* comment */ color: blue; }
+#$#body { color: red;  color: blue; }
```

### Multiple CSS comments

The following code

```adblock
#$#/* comment */body /* comment */ { color: /* comment */ red; }
```

should be reported as:

```shell
1:3 CSS comments are not allowed
1:21 CSS comments are not allowed
1:44 CSS comments are not allowed
```

and should be fixed as:

```diff
===================================================================
--- original
+++ fixed
@@ -1,1 +1,1 @@
-#$#/* comment */body /* comment */ { color: /* comment */ red; }
+#$#body  { color:  red; }
```

## Version

This rule was added in AGLint version 4.0.0

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-css-comments.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-css-comments.test.ts
