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
    <a href="https://adguard.com/"><img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px"> AdGuard</a> |
    <a href="https://github.com/gorhill/uBlock"><img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px"> uBlock Origin</a> |
    <a href="https://adblockplus.org/"><img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px"> Adblock Plus</a>
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
- [Ignoring files or folders](#ignoring-files-or-folders)
  - [Default ignores](#default-ignores)
- [Configuration](#configuration)
  - [Example configurations](#example-configurations)
  - [Configuration hierarchy](#configuration-hierarchy)
    - [Hierarchy](#hierarchy)
- [Linter rules](#linter-rules)
  - [`adg-scriptlet-quotes`](#adg-scriptlet-quotes)
  - [`if-closed`](#if-closed)
  - [`single-selector`](#single-selector)
- [Use programmatically](#use-programmatically)
    - [Parser](#parser)
  - [Linter](#linter)
  - [Converter (WIP)](#converter-wip)
- [Development \& Contribution](#development--contribution)
- [Ideas \& Questions](#ideas--questions)
- [License](#license)
- [References](#references)

## Introduction

`AGLint` is a universal adblock filter list parser, linter and converter. It supports all syntaxes currently in use: AdGuard, uBlock Origin and Adblock Plus. `AGLint` can be used as a command-line tool or as a TS/JS library in the Node.js or browser environment.


Our goal is to provide a tool that can be used by everyone who is interested in adblock filters. We want to make it easy to create and maintain filter lists, and we want to make it easy to use them in adblockers.

Generally the philosophy of `AGLint` are inspired by [ESLint](https://eslint.org/). If you are familiar with `ESLint`, you will find it easy to use `AGLint` as well.

## Features

- :earth_americas: **Universal**: supports all syntaxes currently in use: AdGuard, uBlock Origin and Adblock Plus.
- :white_check_mark: **Error-tolerant**: it can parse any filter list, even if it contains minor syntax errors.
- :zap: **Fast**: made with performance in mind.
- :thumbsup: **Easy to use**: it can be used as a CLI tool or programmatically.
- :art: **Customizable**: you can customize the default configuration by creating a file named `aglint.config.json` in the root of your repo.
- :gear: **Extensible**: you can add your own rules to the linter.
- :globe_with_meridians: **Cross-platform**: it works on Windows, Linux and macOS.
- :globe_with_meridians: **Open-source**: the source code is available here on GitHub.
- :free: **Free**: it is free to use and free to modify.
- :rocket: **Latest technologies**: it is written in TypeScript and can be used in Node.js and browsers as well.

## Getting started

Mainly `AGLint` is a CLI tool, but it can also be used programmatically. Here is a very short instruction on how to use it as a CLI tool with the default configuration.

### Pre-requisites
- Node.js 12 or higher: https://nodejs.org/en/download/
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
   - NPM: `aglint lint` (or `npx aglint lint` if you installed it locally)
   - Yarn: `yarn aglint lint`

That's all! :hugs: The linter will check all filter lists in your project and print the results to the console.

*If you want to customize the default configuration, see [Configuration](#configuration) for more info. If you want to use `AGLint` programmatically, see [Use programmatically](#use-programmatically).*

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

You can customize the default configuration by creating a file named `aglint.config.json` in the root of your repo. You can also use `aglint.config.yml`. If you have multiple folders, you can create a separate configuration file for each folder. If you have a configuration file in a subfolder, it will be used for that subfolder and all its subfolders, but not for the parent folder. It means that the results are always consistent, no matter where you run the linter.

The configuration file should be a valid JSON or YAML file. The following options are available:

- `fix`: enable or disable automatic fixing of errors. Default: `false`. **Be careful with this option!** It will modify your filter list files.
- `rules`: an object with linter rules. See [Linter rules](#linter-rules) for more info. A rule basically has the following structure:
  - `rule-name`: a string with the name of the rule. For example, `rule-1`.
  - `rule-value`: an array with two elements:
    - `rule-severity`: a string with the severity of the rule. It can be `error`, `warn` or `off`.
    - `rule-options`: an object with options for the rule. For example, `{ "option-1": "value-1" }` (optional).
    - For example you can disable the `rule-1` rule by adding the following configuration:
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
      or you can change the severity of the `rule-3` rule to `error` and add an option to it:
      ```json
      {
          "rules": {
              "rule-3": ["error", { "option-3": "value-3" }]
          }
      }
      ```

### Example configurations

Here is an example of a configuration file in JSON syntax (`aglint.config.json`):

```json
{
    "fix": false,
    "rules": {
        "rule-1": ["warn", { "option-1": "value-1" }],
        "rule-2": ["error", { "option-2": "value-2" }],
        "rule-3": ["off"]
    }
}
```

You can also use YAML syntax (`aglint.config.yml`):

```yaml
fix: false
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
  │   ├── aglint.config.json
  │   ├── dir3
  │   │   ├── list3.txt
  │   │   ├── list4.txt
  ├── list5.txt
  ├── aglint.config.json
  ```

If you call the linter in the root folder (`project-root`), it will merge its default configuration with `aglint.config.json` from the root folder.
- Then it lints `dir1/list1.txt`, `dir1/list2.txt` and `list5.txt` with this merged configuration (default configuration + `project-root/aglint.config.json`).
- In the `dir2` folder, it will merge the default configuration with `aglint.config.json` from the `dir2` folder, so it lints `dir2/dir3/list3.txt` and `dir2/dir3/list4.txt` with this merged configuration (default configuration + `project-root/dir2/aglint.config.json`).
- If inline configurations are enabled, then they will be the last in the hierarchy. For example, if you have the following configuration in `project-root/dir2/dir3/list3.txt`:
  ```adblock
  ! aglint {"rules": {"rule-1": "off"}}
  ```
  then the linter will use this configuration for linting the rest of `project-root/dir2/dir3/list3.txt` (default configuration + `project-root/dir2/aglint.config.json` + inline configuration chain within the file).

#### Hierarchy

So the hierarchy is the following:

- Inline configuration (if enabled and present)
- Middle configuration files (if any)
- Configuration file in the current working directory (if any)
- Default configuration (built-in)

## Linter rules

The linter parses your filter list files with the built-in parser, then it checks them against the linter rules. If a linter rule is violated, the linter will report an error or warning. If an adblock rule is syntactically incorrect (aka it cannot be parsed), the linter will report a fatal error and didn't run any other linter rules for that adblock rule, since it is not possible to check it without AST. The rest of the file (valid rules) will be checked with the linting rules.

Currently, the following linter rules are available (we will add more rules in the future):

### `adg-scriptlet-quotes`

Check if the scriptlet parameters are wrapped in the expected quotes. For example
```adblock
example.com#%#//scriptlet("abort-on-property-read", "window.open")
```
will be reported as warning:
```
    1:0     warning The scriptlet should use SingleQuoted quotes
```
since the parameters should be wrapped in single quotes according to AdGuard's coding policy.

But you can specify the expected quotes in the configuration file. If you want to use double quotes, you can add the following configuration:
```json
{
    "rules": {
        "adg-scriptlet-quotes": ["warn", "DoubleQuoted"]
    }
}
```

### `if-closed`

Checks if the `if` statement is closed and no unclosed `endif` statements are present.

For example, in the following case, the first `endif` are unnecessary, and the last `if` statement is not closed:
    
```adblock
!#endif
!#if (adguard_app_android)
example.com##.ad
!#endif
!#if (adguard_ext_firefox)
example.org##.something
```

so the linter will give you the following errors:

```
    1:0     error   Using an "endif" directive without an opening "if" directive
    5:0     error   Unclosed "if" directive
```

### `single-selector`

Checks if the CSS selector contains multiple selectors. For example, `example.com##.ad, .something` will be reported as warning, since it is a bad practice to use multiple selectors in a single rule.

For example, in the following case, the first rule is bad, and the second rule is good:
    
```adblock
example.com##.ad, .something
example.org##.ad
```

so the linter will give you the following warning:

```
    1:0     warning An element hiding rule should contain only one selector
```

It will also suggest a fix for the first rule:

```adblock
example.com##.ad
example.com##.something
example.org##.ad
```

## Use programmatically

You can use several parts of `AGLint` programmatically, but it is only recommended for advanced users who are familiar with Node.js, JavaScript, TypeScript and the basics of software development. Generally, the API are well documented with a lot of examples, but you can open a discussion if you have any questions, we will be happy to help you.

#### Parser

An error-tolerant parser capable of parsing all ADG, uBO and ABP rules currently in use. In other words, any filter list can be parsed with it. The parser API basically has two main parts:
- Parser: parsing rules (string &#8594; AST)
- Generator: serialization of ASTs (AST &#8594; string)

For example, this code:

```typescript
import { RuleParser } from "aglint";

// RuleParser automatically determines the rule type
const ast = RuleParser.parse("example.com,~example.net#%#//scriptlet('prevent-setInterval', 'check', '!300')");
```
will gives you this AST:

```json
{
    "category": "Cosmetic",
    "type": "ScriptletRule",
    "syntax": "AdGuard",
    "exception": false,
    "modifiers": [],
    "domains": [
        {
            "domain": "example.com",
            "exception": false
        },
        {
            "domain": "example.net",
            "exception": true
        }
    ],
    "separator": "#%#//scriptlet",
    "body": {
        "scriptlets": [
            {
                "scriptlet": {
                    "type": "SingleQuoted",
                    "value": "prevent-setInterval"
                },
                "parameters": [
                    {
                        "type": "SingleQuoted",
                        "value": "check"
                    },
                    {
                        "type": "SingleQuoted",
                        "value": "!300"
                    }
                ]
            }
        ]
    }
}
```

Then, you can serialize this AST:
```typescript
RuleParser.generate(ast);
```

Which returns the rule as string (this is not the same as the original rule, it is generated from the AST, and not related to the original rule):
```adblock
example.com,~example.net#%#//scriptlet('prevent-setInterval', 'check', '!300')
```

Please keep in mind that the parser omits unnecessary spaces, so the generated rule may not be the same as the original rule. Only the formatting can change, the rule itself remains the same.

You can pass any rule to the parser, it automatically determines the type and category of the rule.

If the rule is syntactically incorrect, the parser will throw an error.

### Linter

The linter is a tool that checks the rules for errors and bad practices. It is based on the parser, so it can parse all ADG, uBO and ABP rules currently in use. The linter API has two main parts:

- Linter: checks rules (string &#8594; AST &#8594; problem report)
- CLI: a Node.js command-line interface for the linter

Please keep in mind that the CLI only can be used in Node.js (because it uses the `fs` module for file management), but the linter can be used in both Node.js and browsers.

Example usage:

```typescript
import { Linter } from "aglint";

// Create a new linter instance
const linter = new Linter();

// Add default rules - don't forget to add them, otherwise the linter won't do anything
linter.addDefaultRules();

// Add custom rules (optional). Rules are following LinterRule interface.
// linter.addRule("name", { data });

// Lint a content (file content - you can pass new lines as well)
const report = linter.lint("example.com##.ad, #ad");

// Do something with the report :)
```

The `LinterRule` interface has the following structure:

- `meta`: Metadata for the rule
  - `type`: problem, suggestion or layout
  - `severity`: warning, error or fatal
- `events`:
  - `onStartFilterList`: called before analyzing a file
  - `onRule`: Called to analyze a single rule
  - `onEndFilterList`: called after analyzing a file

Every event has a `context` parameter, which makes it possible to get the current filter list content, the current rule, report, etc.

You can check the [`src/linter/rules`](src/linter/rules) directory for detailed examples.

### Converter (WIP)

A tool for converting rules from one syntax to another. Sadly, this feature will only become available in a future version.

A small summary of what to expect:
- Compatibility tables for AdGuard, uBlock Origin and Adblock Plus
  - Extended CSS elements
  - Scriptlets
  - Redirects
  - etc. 
- Rule converter (AST &#8594; AST)
  - The rule converter allows you to convert from any syntax to any syntax, as long as the destination syntax supports the rule type. If it doesn't support the source rule type, an error will be thrown. For example, you cannot convert a CSS injection to Adblock Plus, since ABP simply doesn't support CSS injections.

## Development & Contribution

You can contribute to the project by opening a pull request. Before opening a pull request, make sure that all tests pass and that the code is formatted correctly. You can do this by running `yarn lint` and `yarn test` commands. People who contribute to AdGuard projects can receive various rewards, see [this page](https://adguard.com/contribute.html) for details.

Main development commands:
- `yarn lint`: Run ESLint and Prettier on all files
- `yarn test`: Run all tests
- `yarn coverage`: Get test coverage report
- `yarn build`: Build package (to `dist` folder)

## Ideas & Questions

If you have any questions or ideas for new features, please open an issue or a discussion. We will be happy to discuss it with you.

## License

AGLint is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

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
