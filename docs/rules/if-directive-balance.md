# if-directive-balance

Checks if conditional preprocessor directives are structured correctly.

## Rule Details

This rule ensures that conditional preprocessor directives (`!#if`, `!#else`, `!#endif`) are properly balanced
and structured within adblock filter lists. It validates that:

- Every `!#if` directive has a corresponding `!#endif` directive
- `!#else` and `!#endif` directives are not used without an opening `!#if`
- `!#else` and `!#endif` directives don't have parameters (they should be used alone)

Conditional preprocessor directives allow filter list authors to include or exclude rules based on specific conditions,
making filter lists more flexible and maintainable.

## Metadata

- **Type:** Problem
- **Severity:** Error
- **Recommended:** Yes (enabled by default)
- **Fixable:** Yes (removes invalid parameters)
- **Configuration:** None required

## Configuration

This rule has no configuration options. It is enabled by default in the recommended configuration.

```json
{
  "if-directive-balance": "error"
}
```

## Examples

### ✅ Correct

```adblock
! Simple if block
example.com##.ad
!#if (adguard)
example.com##.adguard-specific
!#endif
example.com##.general
```

```adblock
! If-else block
!#if (ublock)
example.com##.ublock-style
!#else
example.com##.other-blocker-style
!#endif
```

```adblock
! Nested if blocks
!#if (condition1)
example.com##.outer
!#if (condition2)
example.com##.inner
!#endif
!#endif
```

```adblock
! Include directive inside if block
!#if (adguard)
!#include https://example.com/adguard-rules.txt
!#endif
```

### ❌ Incorrect

#### Unclosed `!#if` directive

```adblock
example.com##.ad
!#if (condition1)
example.com##.conditional
! Missing !#endif
```

**Error message:**

```shell
2:0  error  Unclosed "if" directive
```

#### `!#else` without opening `!#if`

```adblock
example.com##.ad
!#else
example.com##.alternative
```

**Error message:**

```shell
2:0  error  Using an "else" directive without an opening "if" directive
```

#### `!#endif` without opening `!#if`

```adblock
example.com##.ad
!#if (condition1)
example.com##.conditional
!#endif
!#endif  ! Extra endif
```

**Error message:**

```shell
5:0  error  Using an "endif" directive without an opening "if" directive
```

#### Invalid parameters on `!#else` and `!#endif`

```adblock
!#if (condition1)
example.com##.rule1
!#else (invalid_param)  ! else should not have parameters
example.com##.rule2
!#endif (invalid_param)  ! endif should not have parameters
```

**Error messages:**

```shell
3:0  error  Invalid usage of preprocessor directive: "else"
5:0  error  Invalid usage of preprocessor directive: "endif"
```

## Auto-fixing

This rule can automatically fix some issues:

### Removing Invalid Parameters

**Before:**

```adblock
!#if (condition1)
example.com##.rule1
!#else (invalid_param)
example.com##.rule2
!#endif (invalid_param)
```

**After:**

```adblock
!#if (condition1)
example.com##.rule1
!#else
example.com##.rule2
!#endif
```

**Note:** The rule cannot automatically fix structural issues like missing `!#endif` or orphaned `!#else`/`!#endif`
directives, as these require manual intervention to determine the intended structure.

## Common Patterns

### Platform-specific Rules

```adblock
! Rules for all platforms
example.com##.common-ad

! AdGuard-specific rules
!#if (adguard)
example.com##.adguard-popup
example.com###adguard-banner
!#endif

! uBlock Origin-specific rules
!#if (ublock)
example.com##.ublock-overlay
!#endif
```

### Feature Detection

```adblock
!#if (adguard_ext_chromium)
! Chromium extension specific rules
example.com##.chrome-specific
!#else
! Fallback for other platforms
example.com##.generic-fallback
!#endif
```

### Conditional Includes

```adblock
!#if (adguard && !adguard_ext_safari)
!#include https://example.com/non-safari-rules.txt
!#endif
```

## When to Use

This rule is **recommended** and should always be enabled because:

1. **Prevents syntax errors:** Unbalanced directives can cause filter list parsing errors
2. **Maintains readability:** Properly structured conditionals make filter lists easier to understand
3. **Ensures compatibility:** Malformed directives may be ignored or cause unexpected behavior in ad blockers
4. **Catches typos:** Helps identify accidentally duplicated or missing directives

## Related Rules

- [`no-unknown-preprocessor-directives`](./no-unknown-preprocessor-directives.md) - Validates that
  only known preprocessor directives are used
