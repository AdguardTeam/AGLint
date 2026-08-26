<!-- markdownlint-disable -->
# `no-duplicated-modifiers`

> ✅ Using `aglint:recommended` preset will enable this rule

## Description

Checks if a network rule contains multiple same modifiers

## Type

Problem. Identifies parts that causes errors or confusing behavior. High priority fix.

## Correct examples

Examples of correct code:

### Network rule, single `script` and `third-party` modifiers

The following code

```adblock
||example.com^$script,third-party
```

should not be reported

## Incorrect examples

Examples of incorrect code:

### Network rule, multiple repeated `script` and `third-party` modifiers

The following code

```adblock
||example.com^$script,third-party,script
```

should be reported as:

```shell
1:34 Duplicated modifier "script"
```

### Network rule, multiple repeated `domain` modifier

The following code

```adblock
ads.js$script,domain=example.com,domain=example.net
```

should be reported as:

```shell
1:33 Duplicated modifier "domain"
```

## Rule source

https://github.com/AdguardTeam/AGLint/blob/master/src/rules/no-duplicated-modifiers.ts

## Test cases

https://github.com/AdguardTeam/AGLint/blob/master/test/rules/no-duplicated-modifiers.test.ts
