<!-- markdownlint-disable -->
# no-inconsistent-hint-platforms

## Description

Checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM() hint at the same time

## Metadata

- Fixable: ❌
- Suggestions: ❌
- Recommended: ✅
- Type: problem

## Options

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": [],
  "minItems": 0
}
```

### Default options

```json
[]
```

## Rule source

https://github.com/AdguardTeam/AGLint/src/rules/no-inconsistent-hint-platforms.ts

## Test cases

https://github.com/AdguardTeam/AGLint/test/rules/no-inconsistent-hint-platforms.test.ts

