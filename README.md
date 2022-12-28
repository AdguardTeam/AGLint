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
  - [Installation](#installation)
- [Special comments](#special-comments)
  - [Ignore rules](#ignore-rules)
    - [Ignore single rule](#ignore-single-rule)
    - [Ignore multiple rules](#ignore-multiple-rules)
    - [Disable some rules](#disable-some-rules)
- [Ignoring files or folders](#ignoring-files-or-folders)
- [Configuration](#configuration)
- [Linter rules](#linter-rules)
  - [if-closed](#if-closed)
  - [single-selector](#single-selector)
- [Use programmatically](#use-programmatically)
    - [Parser](#parser)
  - [Linter](#linter)
  - [Converter (WIP)](#converter-wip)
- [Development](#development)
- [Ideas](#ideas)
- [License](#license)
- [References](#references)

## Introduction

`AGLint` is a universal adblock filter list parser, linter and converter. It supports all syntaxes currently in use: AdGuard, uBlock Origin and Adblock Plus. It is written in TypeScript and can be used in Node.js and browsers as well.

Our goal is to provide a tool that can be used by everyone who is interested in adblock filters. We want to make it easy to create and maintain filter lists, and we want to make it easy to use them in adblockers.

Generally the philosophy of `AGLint` are inspired by [ESLint](https://eslint.org/). If you are familiar with ESLint, you will find it easy to use `AGLint` as well.

## Features

- **Universal**: supports all syntaxes currently in use: AdGuard, uBlock Origin and Adblock Plus.
- **Error-tolerant**: it can parse any filter list, even if it contains minor syntax errors.
- **Fast**: it is written in TypeScript and can be used in Node.js and browsers.
- **Easy to use**: it can be used as a CLI tool or programmatically.
- **Customizable**: you can customize the default configuration by creating a file named `aglint.config.json` in the root of your repo.
- **Extensible**: you can add your own rules to the linter.
- **Cross-platform**: it works on Windows, Linux and macOS.
- **Open-source**: the source code is available here on GitHub.
- **Free**: it is free to use and free to modify.

## Getting started

Mainly `AGLint` is a CLI tool, but it can also be used programmatically. Here is a very short instruction on how to use it as a CLI tool.

### Pre-requisites
- Node.js 12 or higher: https://nodejs.org/en/download/
- NPM or Yarn. NPM is installed with Node.js, so you don't need to install it separately. If you want to use `yarn` instead of `npm`, you can install it from [here](https://classic.yarnpkg.com/en/docs/install)

### Installation
1. Install `AGLint` globally or locally. If you want to use just it in your project, we recommend installing it locally.
   - NPM: 
     - Globally: `npm install -g @adguard/aglint` 
     - Locally: `npm install -D @adguard/aglint`
   - Yarn:
     - Globally: `yarn global add @adguard/aglint`
     - Locally: `yarn add -D @adguard/aglint`
2. If you want to customize the default configuration, create a file named `aglint.config.json` in the root of your repo and add your custom configuration there. See [Configuration](#configuration) for more info.
3. Run AGlint **in your project folder**:
   - NPM: `aglint lint` (or `npx aglint lint` if you installed it locally)
   - Yarn: `yarn aglint lint`

## Special comments

You may not want to lint some rules, so you can add special config / control comments to ignore / customize them. Generally these comments begins with the `! aglint-` prefix.

### Ignore rules

#### Ignore single rule
You can completely disable linting for a rule by adding `! aglint-disable-next-line` comment before the rule. For example, `example.com##.ad` will be ignored in the following case:

```adblock
! aglint-disable-next-line
example.com##.ad
example.net##.ad
```

#### Ignore multiple rules
If you want to ignore multiple rules, you can add `! aglint-disable` comment before the first rule and `! aglint-enable` comment after the last rule. For example, `example.com##.ad` and `example.net##.ad` will be ignored in the following case:

```adblock
! aglint-disable
example.com##.ad
example.net##.ad
! aglint-enable
example.org##.ad
```

#### Disable some rules

You can disable some rules by adding `! aglint-disable-next-line rule1, rule2` comment before the rule.

## Ignoring files or folders

You can ignore files or folders by creating ignore file named `.aglintignore` in any folder. The syntax and behavior of this file is the same as `.gitignore` file. Learn more about `.gitignore` [here](https://git-scm.com/docs/gitignore), if you are not familiar with it.

## Configuration

You can customize the default configuration by creating a file named `aglint.config.json` in the root of your repo. You can also use `aglint.config.yml`. If you have multiple folders, you can create a separate configuration file for each folder. If you have a configuration file in a subfolder, it will be merged with the configuration file in the parent folder.

The configuration file should be a valid JSON or YAML file. The following options are available:

- `colors`: enable or disable colors in the output. Default: `true`.
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

        Configuration file example:

        ```json
        {
            "colors": true,
            "fix": false,
            "rules": {
                "rule-1": ["error", { "option-1": "value-1" }],
                "rule-2": ["warn", { "option-2": "value-2" }],
                "rule-3": ["off"]
            }
        }
        ```

## Linter rules

### if-closed

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

so the linter will give you the following warning:

```
    1:0     error   Using an "endif" directive without an opening "if" directive
    5:0     error   Unclosed "if" directive
```

### single-selector

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

## Use programmatically

You can use several parts of `AGLint` programmatically, but it is only recommended for advanced users who are familiar with JavaScript and TypeScript. Generally, the API are well documented with a lot of examples, but you can open a discussion if you have any questions.

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
```adblock
example.com,~example.net#%#//scriptlet('prevent-setInterval', 'check', '!300')
```

Please keep in mind that the parser omits unnecessary spaces, so the generated rule may not be the same as the original rule.

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

// Add default rules
linter.addDefaultRules();

// Add custom rules (optional). Rules are following LinterRule interface.
// linter.addRule("name", { data });

// Lint a content (file content - you can pass new lines as well)
const report = linter.lint("example.com##.ad, #ad");

// Do something with the report :)
```

### Converter (WIP)

A tool for converting rules from one syntax to another. Sadly, this feature will only become available in a future version.

A small summary of what to expect:
- Compatibility tables for AdGuard, uBlock Origin and Adblock Plus
  - Extended CSS elements
  - Scriptlets
  - Redirects
  - etc. 
- Rule converter (AST &#8594; AST)
  - The rule converter allows you to convert from any syntax to any syntax. If possible, of course, otherwise an error will be thrown. For example, you cannot convert a CSS injection to Adblock Plus, since ABP does not support CSS injections.

## Development

You can contribute to the project by opening a pull request. Before opening a pull request, make sure that all tests pass and that the code is formatted correctly. You can do this by running `yarn lint` and `yarn test` commands.

Main development commands:
- `yarn lint`: Run ESLint and Prettier on all files
- `yarn test`: Run all tests
- `yarn coverage`: Get test coverage report
- `yarn build`: Build package (to `dist` folder)

## Ideas

If you have any ideas for new features, please open an issue or a discussion. We will be happy to discuss it with you.

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