# no-duplicated-hint-platforms

Checks if a platform is used more than once within the same PLATFORM / NOT_PLATFORM hint.

## Rule Details

This rule detects when the same platform is specified multiple times within a single `PLATFORM` or `NOT_PLATFORM`
hint in adblock filter rules. Duplicate platforms are redundant and can lead to confusion, as specifying the same
platform multiple times has no additional effect.

The rule performs case-insensitive comparison, so `windows` and `WINDOWS` are considered duplicates.

This rule applies to:

- `PLATFORM` hints (e.g., `!+ PLATFORM(windows, mac)`)
- `NOT_PLATFORM` hints (e.g., `!+ NOT_PLATFORM(ios, android)`)

## Metadata

- **Type:** Problem
- **Severity:** Error
- **Recommended:** Yes (enabled by default)
- **Fixable:** Yes (automatically removes duplicate platforms)
- **Configuration:** None required

## Configuration

This rule has no configuration options. It is enabled by default in the recommended configuration.

```json
{
  "no-duplicated-hint-platforms": "error"
}
```

## Examples

### ✅ Correct

<!-- markdownlint-disable -->
```adblock
! Single platform
!+ PLATFORM(windows)
example.com##.ad

! Multiple different platforms
!+ PLATFORM(windows, mac, android, ios)
example.com##.banner

! NOT_PLATFORM with different platforms
!+ NOT_PLATFORM(ext_safari, ext_edge)
example.com##.popup

! All supported platforms
!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)
example.com##.overlay
```
<!-- markdownlint-enable -->

### ❌ Incorrect

#### Simple duplicates

```adblock
!+ PLATFORM(windows, windows)
example.com##.ad

!+ NOT_PLATFORM(ios, android, ios)
example.com##.banner
```

**Error messages:**

```shell
1:21  error  Duplicated platform "windows"
3:29  error  Duplicated platform "ios"
```

#### Multiple duplicates

```adblock
!+ PLATFORM(windows, mac, windows, android, mac, ios)
example.com##.popup
```

**Error messages:**

```shell
1:27  error  Duplicated platform "windows"
1:45  error  Duplicated platform "mac"
```

#### Case-insensitive duplicates

```adblock
!+ PLATFORM(Windows, WINDOWS, windows)
example.com##.overlay
```

**Error messages:**

```shell
1:21  error  Duplicated platform "WINDOWS"
1:31  error  Duplicated platform "windows"
```

## Auto-fixing

The rule automatically removes duplicate platform entries:

### Simple Duplicate Removal

**Before:**

```adblock
!+ PLATFORM(windows, windows)
example.com##.ad
```

**After:**

```adblock
!+ PLATFORM(windows)
example.com##.ad
```

### Multiple Duplicate Removal

**Before:**

```adblock
!+ PLATFORM(windows, mac, android, windows, ios, mac, ext_chromium)
example.com##.banner
```

**After:**

```adblock
!+ PLATFORM(windows, mac, android, ios, ext_chromium)
example.com##.banner
```

### NOT_PLATFORM Duplicate Removal

**Before:**

```adblock
!+ NOT_PLATFORM(ext_safari, ext_edge, ext_safari, ext_opera)
example.com##.popup
```

**After:**

```adblock
!+ NOT_PLATFORM(ext_safari, ext_edge, ext_opera)
example.com##.popup
```

## Supported Platforms

The rule works with all AdGuard-supported platforms:

### Desktop Platforms

- `windows` - Windows operating system
- `mac` - macOS operating system

### Mobile Platforms

- `android` - Android operating system
- `ios` - iOS operating system

### Browser Extensions

- `ext_chromium` - Chromium-based browsers (Chrome, Edge, Opera, etc.)
- `ext_ff` - Firefox extension
- `ext_edge` - Microsoft Edge extension
- `ext_opera` - Opera extension
- `ext_safari` - Safari extension
- `ext_android_cb` - Android Content Blocker
- `ext_ublock` - uBlock Origin

## Common Scenarios

### Accidental Copy-Paste

```adblock
! Developer accidentally duplicated a platform
!+ PLATFORM(windows, mac, windows)
example.com##.ad
```

### Case Sensitivity Confusion

```adblock
! Different cases of the same platform
!+ PLATFORM(Windows, WINDOWS, mac)
example.com##.banner
```

### Long Platform Lists

```adblock
! Easy to accidentally duplicate in long lists
!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_safari, ext_opera, ext_safari)
example.com##.popup
```

## Why This Rule Is Important

1. **Eliminates redundancy:** Duplicate platforms serve no purpose and clutter the code
2. **Prevents confusion:** Multiple entries of the same platform can confuse developers
3. **Improves readability:** Clean platform lists are easier to understand and maintain
4. **Catches typos:** Helps identify accidentally duplicated platforms
5. **Reduces file size:** Removes unnecessary duplicate entries

## When to Use

This rule is **recommended** and should always be enabled because:

- **No false positives:** Duplicate platforms are always problematic
- **Automatic cleanup:** Removes duplicates without manual intervention
- **Clear intent:** Makes platform targeting more explicit and readable
- **Prevents errors:** Eliminates potential confusion about platform targeting

## Platform Hint Usage

### PLATFORM Hint

Specifies that the rule should only apply to the listed platforms:

```adblock
!+ PLATFORM(windows, mac)
example.com##.desktop-specific-ad
```

### NOT_PLATFORM Hint

Specifies that the rule should apply to all platforms except the listed ones:

```adblock
!+ NOT_PLATFORM(ext_safari)
example.com##.non-safari-ad
```
