&nbsp;
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/website/github.com/AGLint/aglint_logo_darkmode.svg">
        <img alt="AGLint" src="https://cdn.adguard.com/website/github.com/AGLint/aglint_logo_lightmode.svg" width="350px">
    </picture>
</p>
<h3 align="center">Universal adblock filter list parser, linter and converter.</h3>
<p align="center">
    Supported syntaxes:
</p>
<p align="center">
    <a href="https://adguard.com"><img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px"> AdGuard</a> |
    <a href="https://github.com/gorhill/uBlock"><img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px"> uBlock Origin</a> |
    <a href="https://getadblock.com"><img src="https://cdn.adguard.com/website/github.com/AGLint/ab_logo.svg" width="14px"> AdBlock</a> |
    <a href="https://adblockplus.org"><img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px"> Adblock Plus</a>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@adguard/aglint"><img src="https://img.shields.io/npm/v/@adguard/aglint" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/@adguard/aglint"><img src="https://img.shields.io/npm/dm/@adguard/aglint" alt="NPM Downloads" /></a>
    <a href="https://github.com/AdguardTeam/AGLint/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@adguard/aglint" alt="License" /></a>
</p>

Table of Contents:
- [Introduction](#introduction)
- [Features](#features)
- [Getting started](#getting-started)
  - [Pre-requisites](#pre-requisites)
  - [Installation \& Usage](#installation--usage)
- [VSCode extension](#vscode-extension)
- [Special comments (inline configuration)](#special-comments-inline-configuration)
  - [Ignore adblock rules](#ignore-adblock-rules)
    - [Ignore single adblock rule](#ignore-single-adblock-rule)
    - [Ignore multiple adblock rules](#ignore-multiple-adblock-rules)
    - [Disable some linter rules](#disable-some-linter-rules)
    - [Change linter rules configuration](#change-linter-rules-configuration)
- [Ignoring files or folders](#ignoring-files-or-folders)
  - [Default ignores](#default-ignores)
- [Configuration](#configuration)
  - [Example configurations](#example-configurations)
  - [Configuration hierarchy](#configuration-hierarchy)
    - [Hierarchy](#hierarchy)
- [Linter rules](#linter-rules)
  - [`if-closed`](#if-closed)
  - [`single-selector`](#single-selector)
  - [`duplicated-modifiers`](#duplicated-modifiers)
  - [`unknown-preprocessor-directives`](#unknown-preprocessor-directives)
  - [`duplicated-hint-platforms`](#duplicated-hint-platforms)
  - [`duplicated-hints`](#duplicated-hints)
  - [`unknown-hints-and-platforms`](#unknown-hints-and-platforms)
  - [`invalid-domain-list`](#invalid-domain-list)
  - [`inconsistent-hint-platforms`](#inconsistent-hint-platforms)
- [Use programmatically](#use-programmatically)
    - [Parser](#parser)
  - [Linter](#linter)
  - [Converter (WIP)](#converter-wip)
- [Development \& Contribution](#development--contribution)
  - [Available commands](#available-commands)
- [Ideas \& Questions](#ideas--questions)
- [License](#license)
- [References](#references)

## Introduction

`AGLint` is a universal adblock filter list parser, linter and converter. It supports all syntaxes currently in use: AdGuard, uBlock Origin and AdBlock / Adblock Plus. `AGLint` can be used as a command-line tool or as a TS/JS library in the Node.js or browser environment.

Our goal is to provide a tool that can be used by everyone who is interested in adblock filters. We want to make it easy to create and maintain filter lists.

Generally the philosophy of `AGLint` are inspired by [ESLint](https://eslint.org/). If you are familiar with `ESLint`, you will find it easy to use `AGLint` as well.

## Features

- :earth_americas: **Universal**: supports all syntaxes currently in use: AdGuard, uBlock Origin and AdBlock / Adblock Plus.
- :white_check_mark: **Error-tolerant**: it can parse any filter list, even if it contains minor syntax errors.
- :zap: **Fast**: made with performance in mind.
- :thumbsup: **Easy to use**: it can be used as a CLI tool or programmatically.
- :art: **Customizable**: you can customize the default configuration by creating a file named `.aglintrc` in the root of your repo.
- :gear: **Extensible**: you can add your own rules to the linter.
- :globe_with_meridians: **Cross-platform**: it works on Windows, Linux and macOS.
- :globe_with_meridians: **Open-source**: the source code is available here on GitHub.
- :free: **Free**: it is free to use and free to modify.
- :rocket: **Latest technologies**: it is written in TypeScript and can be used in Node.js and browsers as well.

## Getting started

Mainly `AGLint` is a CLI tool, but it can also be used programmatically. Here is a very short instruction on how to use it as a CLI tool with the default configuration.

### Pre-requisites
- Node.js 14 or higher: https://nodejs.org/en/download/
- NPM or Yarn. NPM is installed with Node.js, so you don't need to install it separately. If you want to use `yarn` instead of `npm`, you can install it from [here](https://classic.yarnpkg.com/en/docs/install)

### Installation & Usage
1. Install `AGLint` globally or locally. If you want to use just it in your project, we recommend installing it locally.
   - NPM: 
     - Globally: `npm install -g @adguard/aglint` 
     - Locally: `npm install -D @adguard/aglint`
   - Yarn:
     - Globally: `yarn global add @adguard/aglint`
     - Locally: `yarn add -D @adguard/aglint`
2. Run AGlint **in your project folder**:
   - NPM: `aglint` (or `npx aglint` if you installed it locally)
   - Yarn: `yarn aglint`

That's all! :hugs: The linter will check all filter lists in your project and print the results to the console.

If you want to lint just some specific files, you can pass them as arguments:
`aglint path/to/file.txt path/to/another/file.txt`

To see all available options, run `aglint --help`.

*To customize the default configuration, see [Configuration](#configuration) for more info. If you want to use `AGLint` programmatically, see [Use programmatically](#use-programmatically).*

## VSCode extension

We have created a VSCode extension that fully covers adblock filter list syntax. It is available [here](https://marketplace.visualstudio.com/items?itemName=adguard.adblock).

This extension enables syntax highlighting, and it's compatible with `AGLint`. Typically, it means that this extension will detect all syntax errors and show them in the editor, and on top of that, it will also show some warnings and hints, because it also runs `AGLint` under the hood.

GitHub Linguist [also uses](https://github.com/github/linguist/pull/5968) this extension to highlight adblock filter lists.

**We strongly recommend using this extension if you are working with adblock filter lists.**

## Special comments (inline configuration)

You may not want to lint some adblock rules, so you can add special inline comments to disable linting for a single adblock rule or for the rest of the file. Generally these comments begins with the `! aglint` prefix. In the following sections you can find more info about these comments.

### Ignore adblock rules

#### Ignore single adblock rule
You can completely disable linting for an adblock rule by adding `! aglint-disable-next-line` comment before the adblock rule. For example, `example.com##.ad` will be ignored in the following case:

```adblock
! aglint-disable-next-line
example.com##.ad
example.net##.ad
```

This lets you disable linting for a single adblock rule, but it doesn't disable linting for the rest of the file. If you want to disable linting for the rest of the file, you can add `! aglint-disable` comment before the first adblock rule or add the file path to the ignore list (`.aglintignore` file). See [Ignoring files or folders](#ignoring-files-or-folders) for more info.

#### Ignore multiple adblock rules
If you want to ignore multiple adblock rules, you can add `! aglint-disable` comment before the first adblock rule and `! aglint-enable` comment after the last adblock rule. For example, `example.com##.ad` and `example.net##.ad` will be ignored in the following case:

```adblock
! aglint-disable
example.com##.ad
example.net##.ad
! aglint-enable
example.org##.ad
```

#### Disable some linter rules

In some cases, you may want to disable some linter rules for a single adblock rule or for multiple adblock rules. Here is how you can do it:

- For a single adblock rule: for example, `rule1` linter rule will be ignored for `example.com##.ad` in the following case (but it will be enabled for `example.net##.ad`):
  ```adblock
  ! aglint-disable-next-line rule1
  example.com##.ad
  example.net##.ad
  ```
- For multiple adblock rules: for example, `rule1, rule2` linter rules will be ignored for `example.com##.ad` and `example.net##.ad` in the following case (but they will be enabled for `example.org##.ad`):
  ```adblock
  ! aglint-disable rule1, rule2
  example.com##.ad
  example.net##.ad
  ! aglint-enable rule1, rule2
  example.org##.ad
  ```

#### Change linter rules configuration

In some cases, you may want to change the configuration of some linter rules during linting. Here is how you can do it:
```adblock
! aglint "rule-1": ["warn", { "option1": "value1" }], "rule-2": "off"
example.com##.ad
example.net##.ad
```

After the `! aglint` comment, you should specify the list of the rules that you want to change. It will applied to all lines after the comment until the end of the file or until the next `! aglint` comment. The syntax is the same as in the [configuration file](#configuration).

## Ignoring files or folders

You can ignore files or folders by creating an "ignore file" named `.aglintignore` in any directory. The syntax and behavior of this file is the same as `.gitignore` file. Learn more about `.gitignore` [here](https://git-scm.com/docs/gitignore) if you are not familiar with it.

If you have a config file in an ignored folder, it will be ignored as well.

### Default ignores

Some "problematic" paths are ignored by default in order to avoid linting files that are not related to adblock filter lists. These paths are:
- `node_modules` - Vendor files for Node.js, usually contains a lot of files - this can slow down the linter significantly
- `.DS_Store` - macOS system file
- `.git` - Git files
- `.hg` - Mercurial files
- `.svn` - Subversion files
- `Thumbs.db` - Windows system file

## Configuration

You can customize the default configuration by creating a file named `.aglintrc` in the root of your repo. You can also use `.aglintrc.yml`. If you have multiple folders, you can create a separate configuration file for each folder. If you have a configuration file in a subfolder, it will be used for that subfolder and all its subfolders, but not for the parent folder. It means that the results are always consistent, no matter where you run the linter.

The configuration file should be a valid JSON or YAML file. The following options are available:

- `allowInlineConfig`: enable or disable inline config comments. For example, `! aglint-disable-next-line` (default: `true`).
- `rules`: an object with linter rules. See [Linter rules](#linter-rules) for more info. A rule basically has the following structure:
  - The key is the name of the rule. For example, `rule-1`.
  - The value is the severity and the configuration of the rule. For example, `"error"` or `["error", { "option-1": "value-1" }]`.
    - The severity always must be specified. It can be `off`, `warn`, `error` or `fatal`. If the rule doesn't have any configuration, you can use a string with the severity. For example, `"error"`. You can also use severity codes instead of severity names (0 = `off`, 1 = `warn`, 2 = `error`, 3 = `fatal`).
    - If the rule has configuration, you must use an array with two elements. The first element is the severity and the rest of the elements are the configuration. For example, `["error", { "option-1": "value-1" }]`.
    - For example you can disable the `rule-1` rule by adding the following configuration:
      ```json
      {
          "rules": {
              "rule-1": "off"
          }
      }
      ```
      but an array also can be used:
      ```json
      {
          "rules": {
              "rule-1": ["off"]
          }
      }
      ```
      or you can change the severity of the `rule-2` rule to `warn`:
      ```json
      {
          "rules": {
              "rule-2": ["warn"]
          }
      }
      ```
      or you can change the severity of the `rule-3` rule to `error` and add a configuration to it:
      ```json
      {
          "rules": {
              "rule-3": ["error", { "option-3": "value-3" }]
          }
      }
      ```

### Example configurations

Here is an example of a configuration file in JSON syntax (`.aglintrc`):

```json
{
    "allowInlineConfig": true,
    "rules": {
        "rule-1": ["warn", { "option-1": "value-1" }],
        "rule-2": ["error", { "option-2": "value-2" }],
        "rule-3": ["off"]
    }
}
```

You can also use YAML syntax (`.aglintrc.yml`):

```yaml
allowInlineConfig: true
rules:
  rule-1:
    - warn
    - option-1: value-1
  rule-2:
    - error
    - option-2: value-2
  rule-3:
    - off
```

JavaScript and TypeScript configuration files aren't supported at the moment, but we will add support for them in the future.

### Configuration hierarchy

Basically the linter always uses the default configuration as a base. If the current working directory (alias `cwd` - the folder where you call the linter) has a configuration file, it will be merged with the default configuration. If you have a configuration file in a subfolder, it will be merged with the default configuration, but not with the configuration file from the parent folder. It means that the results are always consistent, no matter where you run the linter.

Suppose your project has the following structure:
  
  ```
  project-root
  ├── dir1
  │   ├── list1.txt
  │   ├── list2.txt
  ├── dir2
  │   ├── .aglintrc
  │   ├── dir3
  │   │   ├── list3.txt
  │   │   ├── list4.txt
  ├── list5.txt
  ├── .aglintrc
  ```

If you call the linter in the root folder (`project-root`), it will merge its default configuration with `.aglintrc` from the root folder.
- Then it lints `dir1/list1.txt`, `dir1/list2.txt` and `list5.txt` with this merged configuration (default configuration + `project-root/.aglintrc`).
- In the `dir2` folder, it will merge the default configuration with `.aglintrc` from the `dir2` folder, so it lints `dir2/dir3/list3.txt` and `dir2/dir3/list4.txt` with this merged configuration (default configuration + `project-root/dir2/.aglintrc`).
- If inline configurations are enabled, then they will be the last in the hierarchy. For example, if you have the following configuration in `project-root/dir2/dir3/list3.txt`:
  ```adblock
  ! aglint "rule-1": "off"
  ```
  then the linter will use this configuration for linting the rest of `project-root/dir2/dir3/list3.txt` (default configuration + `project-root/dir2/.aglintrc` + inline configuration chain within the file).

#### Hierarchy

So the hierarchy is the following:

- Inline configuration (if enabled and present)
- Middle configuration files (if any)
- Configuration file in the current working directory (if any)
- Default configuration (built-in)

## Linter rules

The linter parses your filter list files with the built-in parser, then it checks them against the linter rules. If a linter rule is violated, the linter will report an error or warning. If an adblock rule is syntactically incorrect (aka it cannot be parsed), the linter will report a fatal error and didn't run any other linter rules for that adblock rule, since it is not possible to check it without AST. The rest of the file (valid rules) will be checked with the linting rules.

The linter rules documentation is written in the following schema:
- *Short description of the rule in the first paragraph.*
- **Severity:** Severity of the rule, it can be `warn` (1), `error` (2), `fatal` (3).
- **Options:** Configuration options for the rule (if any).
- **Options schema:** Validation schema for the rule options (if any).
- **Fixable:** Describes if the rule can fix the detected problem automatically.
- **Example:** A simple example of the rule violation and how it will be reported.
- **Example for fixing:** A simple example of the rule violation and how it will be fixed (if the problem is fixable).

Currently, the following linter rules are available (we will add more rules in the future):

### `if-closed`

Checks if the `if` statement is closed and no unclosed `endif` statements are present.

- **Severity:** `error` (2)
- **Options:** none
- **Fixable:** no
- **Example:**
  ```adblock
  !#endif
  !#if (adguard_app_android)
  example.com##.ad
  !#endif
  !#if (adguard_ext_firefox)
  example.org##.something
  ```
  will be reported as error:
  ```
    1:0  error  Using an "endif" directive without an opening "if" directive
    5:0  error  Unclosed "if" directive
  ```
  since the first `endif` are unnecessary, and the last `if` statement is not closed.

### `single-selector`

Checks element hiding rules to make sure that they contain only one selector.

- **Severity:** `warn` (1)
- **Options:** none
- **Fixable:** yes, the rule will be split into multiple rules, each with a single selector
- **Example:**
  ```adblock
  example.com##.ad, .something
  ```
  will be reported as warning:
  ```
    1:0  warn  An element hiding rule should contain only one selector
  ```
  since the rule contains two selectors.
- **Example for fixing:**
  ```adblock
  example.com##.ad, .something
  ```
  will be fixed to:
  ```adblock
  example.com##.ad
  example.com##.something
  ```
  (two separate rules with a single selector each).

### `duplicated-modifiers`

Checks if the same modifier is used multiple times in a single network rule.

- **Severity:** `error` (2)
- **Options:** none
- **Fixable:** planned
- **Example:**
  ```adblock
  example.com$important,important
  ```
  will be reported as error:
  ```
    1:0  error  The "important" modifier is used multiple times
  ```
  since the `important` modifier is used twice.

### `unknown-preprocessor-directives`

Checks if the used preprocessor directives are known.

- **Severity:** `error` (2)
- **Options:** none
- **Fixable:** no
- **Example:**
  ```adblock
  !#unknown
  ```
  will be reported as error:
  ```
    1:0  error  Unknown preprocessor directive: "unknown"
  ```
  since `unknown` is not a known preprocessor directive.
- **Additional information:**
  - Currently, the following preprocessor directives are supported:
    - `if`: [documentation](https://adguard.com/kb/general/ad-filtering/create-own-filters/#conditions-directive)
    - `endif`: [documentation](https://adguard.com/kb/general/ad-filtering/create-own-filters/#conditions-directive)
    - `include`: [documentation](https://adguard.com/kb/general/ad-filtering/create-own-filters/#include-directive)
    - `safari_cb_affinity`: [documentation](https://adguard.com/kb/general/ad-filtering/create-own-filters/#safari-affinity-directive)
  - For more information about preprocessor directives, please visit
    - https://adguard.com/kb/general/ad-filtering/create-own-filters/#preprocessor-directives or
    - https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#pre-parsing-directives

### `duplicated-hint-platforms`

Checks if the same platform is used multiple times in a single hint.

- **Severity:** `warn` (1)
- **Options:** none
- **Fixable:** planned
- **Example:**
  ```adblock
  !+ PLATFORM(ios, android, ios)
  ```
  will be reported as warning:
  ```
    1:0  warn  The "ios" platform is used multiple times
  ```
  since the `ios` platform is used twice. In this case, you'll need to remove the unnecessary `ios` platform.

### `duplicated-hints`

Checks if the same hint is used multiple times within a single comment.

- **Severity:** `warn` (1)
- **Options:** none
- **Fixable:** planned
- **Example:**
  ```adblock
  !+ PLATFORM(ios, ext_android_cb) PLATFORM(ext_ff) NOT_OPTIMIZED
  ```
  will be reported as warning:
  ```
    1:0  warn  The "PLATFORM" hint is used multiple times
  ```
  since the `PLATFORM` hint is used twice in the same comment. In this case, you'll need to concatenate the platforms into a single `PLATFORM` hint.

### `unknown-hints-and-platforms`

Checks if the hints and platforms are known.

- **Severity:** `error` (2)
- **Options:** none
- **Fixable:** no
- **Example:**
  ```adblock
  !+ HINT
  !+ HINT(param)
  !+ PLATFORM(something)
  ```
  will be reported as error:
  ```
    1:0  error  Unknown hint: "HINT"
    2:0  error  Unknown hint: "HINT"
    3:0  error  Unknown platform: "something"
  ```
  since `HINT` are an unknown hint, and `something` is an unknown platform.
- **Additional information:**
  - Currently, the following hints are supported:
    - `NOT_OPTIMIZED`: [documentation](https://adguard.com/kb/general/ad-filtering/create-own-filters/#not_optimized-hint)
    - `PLATFORM` / `NOT_PLATFORM`: [documentation](https://adguard.com/kb/general/ad-filtering/create-own-filters/#platform-and-not_platform-hints)
  - Currently, the following platforms are supported:
    - `windows`
    - `mac`
    - `android`
    - `ios`
    - `ext_chromium`
    - `ext_ff`
    - `ext_edge`
    - `ext_opera`
    - `ext_safari`
    - `ext_android_cb`
    - `ext_ublock`

### `invalid-domain-list`

Checks for invalid domains in cosmetic rules.

- **Severity:** `error` (2)
- **Options:** none
- **Fixable:** no
- **Example:**
  ```adblock
  example.##.ad
  ```
  will be reported as error:
  ```
    1:0  error  Invalid domain: "example."
  ```
  since `example.` is not a valid domain, because it's TLD is empty. In this case, you'll need to specify TLD for the domain, for example, `example.com`, or use a wildcard as TLD: `example.*`.
- **Additional information:**
    - Accepted values are:
      - Regular domains: `example.com`, `example.org`, `example.net`, etc.
      - Domains with wildcards: `*.example.com`, `*.example.org`, `*.example.net`, etc.
      - Wildcard-only domain: `*`
      - IDN domains: `xn--e1afmkfd.xn--p1ai`, etc.
      - Unicode domains: `пример.рф`, etc.
      - Hostnames: `example`, `example-2`, `example-3`, etc.
      - IP addresses: `127.0.0.1`

### `inconsistent-hint-platforms`

Check if the hint platforms are targeted inconsistently. This means that the same platform is targeted in the `PLATFORM` hint, but excluded in the `NOT_PLATFORM` hint at the same time (or vice versa).

- **Severity:** `error` (2)
- **Options:** none
- **Fixable:** no
- **Example:**
  ```adblock
  !+ PLATFORM(ios, ext_android_cb) NOT_PLATFORM(ext_android_cb)
  example.com##.ad
  ```
  will be reported as error:
  ```
    1:0  error  The "ext_android_cb" platform is targeted inconsistently
  ```
  since the `ext_android_cb` platform is targeted in the `PLATFORM` hint, but excluded in the `NOT_PLATFORM` hint at the same time. In this case, you'll need to remove the `ext_android_cb` platform from some of the hints to make it's targeting consistent.

## Use programmatically

You can use several parts of `AGLint` programmatically, but it is only recommended for advanced users who are familiar with Node.js, JavaScript, TypeScript and the basics of software development. Generally, the API are well documented with a lot of examples, but you can open a discussion if you have any questions, we will be happy to help you.

#### Parser

An error-tolerant parser capable of parsing all ADG, uBO and ABP rules currently in use. In other words, any filter list can be parsed with it. The parser API basically has two main parts:
- Parser: parsing rules (string &#8594; AST)
- Generator: serialization of ASTs (AST &#8594; string)

For example, this code:

```typescript
import { RuleParser } from '@adguard/aglint';

// RuleParser automatically determines the rule type
const ast = RuleParser.parse('/ads.js^$script,domain=example.com');
```
will gives you this AST:

```json
{
    "category": "Network",
    "type": "BasicNetworkRule",
    "syntax": "Common",
    "exception": false,
    "pattern": "/ads.js^",
    "modifiers": [
        {
            "modifier": "script",
            "exception": false
        },
        {
            "modifier": "domain",
            "value": "example.com",
            "exception": false
        }
    ]
}
```

Then, you can serialize this AST:
```typescript
RuleParser.generate(ast);
```

Which returns the rule as string (this is not the same as the original rule, it is generated from the AST, and not related to the original rule):
```adblock
/ads.js^$script,domain=example.com
```

Please keep in mind that the parser omits unnecessary spaces, so the generated rule may not be the same as the original rule. Only the formatting can change, the rule itself remains the same. You can pass any rule to the parser, it automatically determines the type and category of the rule. If the rule is syntactically incorrect, the parser will throw an error.

### Linter

The linter is a tool that checks the rules for errors and bad practices. It is based on the parser, so it can parse all ADG, uBO and ABP rules currently in use. The linter API has two main parts:

- Linter: checks rules (string &#8594; AST &#8594; problem report)
- CLI: a Node.js command-line interface for the linter

Please keep in mind that the CLI only can be used in Node.js (because it uses the `fs` module for file management), but the linter can be used in both Node.js and browsers.

Example usage:

```typescript
import { Linter } from "@adguard/aglint";

// Create a new linter instance and add default rules (make first parameter true to add default rules)
const linter = new Linter(true);

// Add custom rules (optional). Rules are following LinterRule interface.
// linter.addRule("name", { data });

// Lint a content (file content - you can pass new lines as well)
// If you want to enable the fixer, pass true as the second parameter
const report = linter.lint("example.com##.ad, #ad");

// Do something with the report
```

The `LinterRule` interface has the following structure:

- `meta`: Metadata for the rule
  - `severity`: warning, error or fatal
  - `config`: configuration for the rule (optional)
    - `default`: default value for the configuration
    - `schema`: [Superstruct](https://www.npmjs.com/package/superstruct) schema for the configuration
- `events`:
  - `onStartFilterList`: called before analyzing a file
  - `onRule`: Called to analyze a single rule
  - `onEndFilterList`: called after analyzing a file

Every event has a `context` parameter, which makes it possible to get the current filter list content, the current rule, report, etc.

You can check the [`src/linter/rules`](src/linter/rules) directory for detailed examples.

You can find the detailed linter rule documentation [here](src/linter/rules/README.md).

### Converter (WIP)

A tool for converting rules from one syntax to another. Sadly, this feature will only become available in a future version.

A small summary of what to expect:
- Compatibility tables for AdGuard, uBlock Origin and AdBlock / Adblock Plus
  - Extended CSS elements
  - Scriptlets
  - Redirects
  - etc. 
- Rule converter (AST &#8594; AST)
  - The rule converter allows you to convert from any syntax to any syntax, as long as the destination syntax supports the rule type. If it doesn't support the source rule type, an error will be thrown. For example, you cannot convert a CSS injection to AdBlock / Adblock Plus, since ABP simply doesn't support CSS injections.

## Development & Contribution

You can contribute to the project by opening a pull request. People who contribute to AdGuard projects can receive various rewards, see [this page](https://adguard.com/contribute.html) for details.

Here is a short guide on how to set up the development environment and how to submit your changes:

- Pre-requisites: [Node.js](https://nodejs.org/en/) (v14 or higher), [Yarn](https://yarnpkg.com/) (v2 or higher), [Git](https://git-scm.com/), [VSCode](https://code.visualstudio.com/) (optional)
- Clone the repository with `git clone`
- Install dependencies with `yarn` (this will also initialize the Git hooks via Husky)
- Create a new branch with `git checkout -b <branch-name>`. Example: `git checkout -b feature/add-some-feature`. Please add `feature/` or `fix/` prefix to your branch name, and refer to the issue number if there is one. Example: `fix/42`.
- Make your changes in the `src` folder and make suitable tests for them in the `test` folder
- Check code by running `yarn lint` and `yarn test` commands (during development, you can run only a specific test with `yarn test <test-name>`)
- Build the library with `yarn build` and check the `dist` folder to make sure that the build is successful, then install the library locally with `yarn add <path-to-local-library>` and test it in your project
- If everything is OK, commit your changes and push them to your forked repository. If Husky is set up correctly, it don't allow you to commit if the linter or tests fail.
- Create a pull request to the main repository from your forked repository's branch.

We would be happy to review your pull request and merge it if it is suitable for the project.

### Available commands

During development, you can use the following commands (listed in `package.json`):

- `yarn check-types` - check types with [TypeScript](https://www.typescriptlang.org/)
- `yarn lint` - lint the code with [ESLint](https://eslint.org/)
- `yarn test` - run tests with [Jest](https://jestjs.io/) (you can also run a specific test with `yarn test <test-name>`)
- `yarn coverage` - print test coverage report
- `yarn build` - build the library to the `dist` folder by using [Rollup](https://rollupjs.org/)

## Ideas & Questions

If you have any questions or ideas for new features, please open an issue or a discussion. We will be happy to discuss it with you.

## License

AGLint is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## References

Here are some useful links to help you write adblock rules. This list is not exhaustive, so if you know any other useful resources, please let us know.

- Basic documentations for each syntax:
  - ADG _How to create your own ad filters_: https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
  - uBO _Static filter syntax_: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
  - ABP _How to write filters_: https://help.eyeo.com/adblockplus/how-to-write-filters
- Extended CSS:
  - MDN _CSS selectors_: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
  - ADG _Extended CSS capabilities_: https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md#extended-capabilities
  - uBO _Procedural cosmetic filters_: https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters
  - ABP _Extended CSS selectors_: https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide-emulation
- Scriptlets:
  - ADG scriptlets: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/about-scriptlets.md#scriptlets
  - uBO scriptlets: https://github.com/gorhill/uBlock/wiki/Resources-Library#available-general-purpose-scriptlets
  - ABP snippets: https://help.eyeo.com/adblockplus/snippet-filters-tutorial#snippets-ref
- Third party libraries:
  - CSSTree: https://github.com/csstree/csstree/tree/master/docs
- AdGuard's compatibility tables:
  - https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/compatibility-table.md
