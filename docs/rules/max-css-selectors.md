# max-css-selectors

Checks if a CSS selector list contains more than the specified number of selectors.

## Rule Details

This rule enforces a maximum number of selectors allowed in a single CSS selector list within adblock filter rules.
When a selector list exceeds the configured limit, the rule will report an error and can automatically split
the rule into multiple separate rules, each containing a single selector (or up to the maximum allowed).

This rule applies to:

- Element hiding rules (e.g., `example.com##.selector1, .selector2`)
- CSS injection rules (e.g., `example.com#$#.selector1, .selector2 { style }`)

## Metadata

- **Type:** Layout
- **Severity:** Configurable (default: error)
- **Recommended:** No (optional rule)
- **Fixable:** Yes (automatically splits rules)
- **Configuration:** Required

## Configuration

This rule requires configuration and accepts an object with the following property:

### `maxSelectors`

- **Type:** `number`
- **Default:** `1`
- **Minimum:** `1`
- **Description:** The maximum number of selectors allowed in a single selector list

### Configuration Schema

```json
{
  "max-css-selectors": [
    "error",
    {
      "maxSelectors": 1
    }
  ]
}
```

## Examples

### ❌ Incorrect (with `maxSelectors: 1`)

```adblock
example.com##.ad1, .ad2
example.com##.banner, .popup, .overlay
example.com#$#.ad1, .ad2 { display: none; }
```

**Error messages:**

```shell
1:13  error  This selector list contains 2 selectors, but only 1 are allowed
2:13  error  This selector list contains 3 selectors, but only 1 are allowed
3:15  error  This selector list contains 2 selectors, but only 1 are allowed
```

### ✅ Correct (with `maxSelectors: 1`)

```adblock
example.com##.ad1
example.com##.ad2
example.com##.banner
example.com##.popup
example.com##.overlay
example.com#$#.ad1 { display: none; }
example.com#$#.ad2 { display: none; }
```

### ❌ Incorrect (with `maxSelectors: 2`)

```adblock
example.com##.ad1, .ad2, .ad3
example.com##.banner, .popup, .overlay, .sidebar
```

**Error messages:**

```shell
1:13  error  This selector list contains 3 selectors, but only 2 are allowed
2:13  error  This selector list contains 4 selectors, but only 2 are allowed
```

### ✅ Correct (with `maxSelectors: 2`)

```adblock
example.com##.ad1, .ad2
example.com##.banner, .popup
example.com##.overlay
example.com##.sidebar
```

## Auto-fixing

When auto-fix is enabled, this rule will automatically split rules with multiple selectors into separate rules:

**Before:**

```adblock
example.com##.ad1, .ad2, .ad3
```

**After (with `maxSelectors: 1`):**

```adblock
example.com##.ad1
example.com##.ad2
example.com##.ad3
```

**Before:**

```adblock
example.com#$#.banner, .popup { display: none !important; }
```

**After (with `maxSelectors: 1`):**

```adblock
example.com#$#.banner { display: none !important; }
example.com#$#.popup { display: none !important; }
```

## When to Use

This rule is **not recommended** by default because multiple selectors in a single rule are often more efficient
and readable. However, you might want to enable this rule if:

1. **Performance concerns:** Some ad blockers may have better performance with single-selector rules
2. **Debugging:** Single-selector rules make it easier to identify which specific selector is causing issues
3. **Compatibility:** Some older ad blockers might have limitations with complex selector lists
4. **Code style:** Your project prefers explicit, single-purpose rules

## Version

This rule is available since AGLint v4.0.0.
