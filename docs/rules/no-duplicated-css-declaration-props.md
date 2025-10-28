# no-duplicated-css-declaration-props

Checks for duplicated CSS declaration properties within the same rule block.

## Rule Details

This rule detects when the same CSS property is declared multiple times within a single CSS rule block in adblock
filter rules. Duplicate properties can lead to confusion, maintenance issues, and unexpected behavior since only the
last declaration typically takes effect.

The rule provides intelligent handling based on property values:

- **Identical values:** Automatically removes duplicate declarations
- **Different values:** Provides suggestions to remove either the first or current declaration

This rule applies to CSS injection rules (e.g., `example.com#$#.selector { property: value; }`).

## Metadata

- **Type:** Problem
- **Severity:** Error
- **Recommended:** Yes (enabled by default)
- **Fixable:** Yes (automatically removes identical duplicates)
- **Suggestions:** Yes (provides options for different values)
- **Configuration:** None required

## Configuration

This rule has no configuration options. It is enabled by default in the recommended configuration.

```json
{
  "no-duplicated-css-declaration-props": "error"
}
```

## Examples

### ✅ Correct

```adblock
! Single property declaration
example.com#$#.ad { display: none; }

! Multiple different properties
example.com#$#.banner { display: none; visibility: hidden; opacity: 0; }

! Different selectors can have same properties
example.com#$#.ad1 { padding: 10px; }
example.com#$#.ad2 { padding: 20px; }
```

### ❌ Incorrect

#### Identical duplicate values (auto-fixable)

```adblock
example.com#$#.ad { display: none; display: none; }
example.com#$#.banner { padding: 10px; margin: 5px; padding: 10px; }
```

**Error messages:**

```shell
1:32  error  Duplicated CSS property "display"
2:49  error  Duplicated CSS property "padding"
```

#### Different duplicate values (requires manual choice)

```adblock
example.com#$#.ad { display: none; display: block; }
example.com#$#.popup { padding: 10px; color: red; padding: 20px; }
```

**Error messages:**

```shell
1:32  error  Duplicated CSS property "display"
2:51  error  Duplicated CSS property "padding"
```

## Auto-fixing

The rule automatically fixes duplicates with identical values:

### Automatic Fixes (Identical Values)

**Before:**

```adblock
example.com#$#.ad { display: none; display: none; }
```

**After:**

```adblock
example.com#$#.ad { display: none; }
```

**Before:**

```adblock
example.com#$#.banner { padding: 10px; margin: 5px; padding: 10px; padding: 10px; }
```

**After:**

```adblock
example.com#$#.banner { padding: 10px; margin: 5px; }
```

### Suggestions (Different Values)

When duplicate properties have different values, the rule provides suggestions instead of automatic fixes:

**Problem:**

```adblock
example.com#$#.ad { display: none; display: block; }
```

**Suggestions:**

1. **Remove first declaration:** `Remove first "display" declaration (value: none)`
2. **Remove current declaration:** `Remove current "display" declaration (value: block)`

Applying the first suggestion results in:

```adblock
example.com#$#.ad { display: block; }
```

Applying the second suggestion results in:

```adblock
example.com#$#.ad { display: none; }
```

## Common Scenarios

### Accidental Duplicates

```adblock
! Common mistake: copy-paste errors
example.com#$#.ad { display: none; visibility: hidden; display: none; }
```

### Conflicting Values

```adblock
! Developer changed their mind but forgot to remove old value
example.com#$#.popup { background: red; color: white; background: blue; }
```

### Multiple Duplicates

```adblock
! Multiple instances of the same property
example.com#$#.banner { padding: 5px; margin: 10px; padding: 10px; color: red; padding: 15px; }
```

## Why This Rule Is Important

1. **Prevents confusion:** Duplicate properties make it unclear which value is intended
2. **Improves maintainability:** Removes redundant code that can cause maintenance issues
3. **Ensures predictability:** Only the last declaration takes effect, which may not be obvious
4. **Catches copy-paste errors:** Common source of duplicate properties
5. **Reduces file size:** Removes unnecessary duplicate declarations

## When to Use

This rule is **recommended** and should always be enabled because:

- **No false positives:** Duplicate properties are always problematic
- **Clear intent:** Helps clarify developer intent when values differ
- **Automatic cleanup:** Removes obvious duplicates automatically
- **Guided resolution:** Provides clear options when manual intervention is needed
