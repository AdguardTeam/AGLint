<!-- markdownlint-disable -->
&nbsp;
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/website/github.com/AGLint/aglint_logo_darkmode.svg">
        <img alt="AGLint" src="https://cdn.adguard.com/website/github.com/AGLint/aglint_logo_lightmode.svg" width="350px">
    </picture>
</p>
<h3 align="center">Universal adblock filter list linter.</h3>
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
<!-- markdownlint-restore -->

Table of Contents:

- [Introduction](#introduction)
- [Features](#features)
- [Getting started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation \& Usage](#installation--usage)
    - [Integrate AGLint into your project](#integrate-aglint-into-your-project)
- [VSCode extension](#vscode-extension)
- [Ignoring files or folders](#ignoring-files-or-folders)
    - [Default ignores](#default-ignores)
- [Configuration](/docs/configuration.md)
- [Development \& Contribution](#development--contribution)
- [Ideas \& Questions](#ideas--questions)
- [License](#license)
- [References](#references)

## Introduction

AGLint is a universal adblock filter list linter. It supports all popular syntaxes currently in use:

<!--markdownlint-disable MD013-->
- <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px" alt="AdGuard"> [AdGuard][adg-url]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px" alt="uBlock Origin"> [uBlock Origin][ubo-url]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px" alt="Adblock Plus"> [Adblock Plus][abp-url]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/ab_logo.svg" width="14px" alt="AdBlock"> [AdBlock][ab-url]
<!--markdownlint-enable MD013-->

AGLint can be used as a command-line tool or as a TS/JS library in the Node.js or browser environment.

Our goal is to provide a tool that can be used by everyone who is interested in adblock filters. We want to make it easy
to create and maintain filter lists.

Generally the philosophy of AGLint are inspired by [ESLint][eslint]. If you are familiar with ESLint, you will find
it easy to use AGLint as well.

## Features

- **Universal syntax support**: AdGuard, uBlock Origin, Adblock Plus, and AdBlock
- **Auto-fixing**: automatically fix linting issues with `--fix`
- **Cascading configuration**: hierarchical `.aglintrc` files with `extends` support
- **Ignore patterns**: `.aglintignore` files for excluding files
- **Multi-threaded**: parallel processing with intelligent caching
- **CLI and programmatic API**: use as command-line tool or TypeScript/JavaScript library
- **LSP integration**: designed for language servers and IDE extensions

## Getting started

Mainly AGLint is a CLI tool, but it can also be used programmatically.
Here is a very short instruction on how to use it as a CLI tool with the default configuration.

### Prerequisites

Ensure that [Node.js][nodejs] is installed on your computer.
Optionally, you can also install [pnpm][pnpm] or [Yarn][yarn] for package management.

[nodejs]: https://nodejs.org/en/download
[pnpm]: https://pnpm.io/installation
[yarn]: https://classic.yarnpkg.com/en/docs/install

### Installation & Usage

1. Install AGLint to your project:
   - NPM: `npm install -D @adguard/aglint`
   - PNPM: `pnpm install -D @adguard/aglint`
   - Yarn: `yarn add -D @adguard/aglint`
1. Initialize the configuration file for AGLint:
   - NPM: `npx aglint init`
   - PNPM: `pnpm aglint init`
   - Yarn: `yarn aglint init`
1. Run AGLint:
   - NPM: `npx aglint`
   - PNPM: `pnpm aglint`
   - Yarn: `yarn aglint`

That's all! :hugs: The linter will check all filter lists in your project and print the results to the console.

> [!NOTE]
> You can also install AGLint globally, so you can use it without `npx` or `pnpm`, but we recommend to install
> it locally to your project.

> [!NOTE]
> If you want to lint just some specific files, you can pass them as arguments:
> `aglint path/to/file.txt path/to/another/file.txt`

> [!NOTE]
> To see all available options, run `aglint --help`.

*To customize the default configuration, see [Configuration](./docs/configuration.md) for more info.
If you want to use AGLint programmatically, see [Use programmatically](/docs/how-to-use-programmatically.md).*

### Integrate AGLint into your project

If you would like to integrate AGLint into your project / filter list, please read our detailed
[Integration guide][integration-guide] for more info.

## VSCode extension

We have created a VSCode extension that fully covers adblock filter list syntax. It is available
[in the VSCode marketplace][vscode-extension].

This extension enables syntax highlighting, and it's compatible with AGLint. Typically, it means that this extension
will detect all syntax errors and show them in the editor, and on top of that, it will also show some warnings and
hints, because it also runs AGLint under the hood.

GitHub Linguist [also uses][linguist-pr] this extension to highlight adblock filter lists.

**We strongly recommend using this extension if you are working with adblock filter lists.**

## Ignoring files or folders

You can ignore files or folders by creating an "ignore file" named `.aglintignore` in any directory. The syntax and
behavior of this file is the same as `.gitignore` file. Learn more about `.gitignore` [in the docs][gitignore-docs]
if you are not familiar with it.

If you have a config file in an ignored folder, it will be ignored as well.

### Default ignores

Some "problematic" paths are ignored by default in order to avoid linting files that are not related to adblock filter
lists. These paths are:

- `node_modules` - Vendor files for Node.js, usually contains a lot of files - this can slow down the linter
  significantly
- `.DS_Store` - macOS system file
- `.git` - Git files
- `.hg` - Mercurial files
- `.svn` - Subversion files
- `Thumbs.db` - Windows system file

## Development & Contribution

Please read the [CONTRIBUTING.md][contributing-url] file for details on how to contribute to this project.

## Ideas & Questions

If you have any questions or ideas for new features, please open an issue or a discussion. We will be happy to discuss
it with you.

## License

AGLint is licensed under the MIT License. See the [LICENSE][aglint-license] file for details.

## References

Here are some useful links to help you write adblock rules. This list is not exhaustive, so if you know any other useful
resources, please let us know.

<!--markdownlint-disable MD013-->
- Syntax documentation:
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px" alt="AdGuard"> [AdGuard: *How to create your own ad filters*][adg-filters]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px" alt="uBlock Origin"> [uBlock Origin: *Static filter syntax*][ubo-filters]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px" alt="Adblock Plus"> [Adblock Plus: *How to write filters*][abp-filters]
- Extended CSS documentation:
    - [MDN: *CSS selectors*][mdn-css-selectors]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px" alt="AdGuard"> [AdGuard: *Extended CSS capabilities*][adg-ext-css]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px" alt="uBlock Origin"> [uBlock Origin: *Procedural cosmetic filters*][ubo-procedural]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px" alt="Adblock Plus"> [Adblock Plus: *Extended CSS selectors*][abp-ext-css]
- Scriptlets:
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px" alt="AdGuard"> [AdGuard scriptlets][adg-scriptlets]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px" alt="uBlock Origin"> [uBlock Origin scriptlets][ubo-scriptlets]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px" alt="Adblock Plus"> [Adblock Plus snippets][abp-snippets]
- Third party libraries:
    - <img src="https://raw.githubusercontent.com/csstree/csstree/master/assets/csstree-logo-rounded.svg" width="14px" alt="CSSTree"> [CSSTree docs][css-tree-docs]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px" alt="AdGuard"> [AdGuard's compatibility table][adg-compatibility-table]
<!--markdownlint-enable MD013-->

[ab-url]: https://getadblock.com
[abp-ext-css]: https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide-emulation
[abp-filters]: https://help.eyeo.com/adblockplus/how-to-write-filters
[abp-snippets]: https://help.eyeo.com/adblockplus/snippet-filters-tutorial#snippets-ref
[abp-url]: https://adblockplus.org
[adg-compatibility-table]: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/compatibility-table.md
[adg-ext-css]: https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md
[adg-filters]: https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
[adg-scriptlets]: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/about-scriptlets.md#scriptlets
[adg-url]: https://adguard.com
[aglint-license]: https://github.com/AdguardTeam/AGLint/blob/master/LICENSE
[contributing-url]: https://github.com/AdguardTeam/AGLint/tree/master/CONTRIBUTING.md
[css-tree-docs]: https://github.com/csstree/csstree/tree/master/docs
[eslint]: https://eslint.org/
[gitignore-docs]: https://git-scm.com/docs/gitignore
[integration-guide]: https://github.com/AdguardTeam/AGLint/blob/master/docs/repo-integration.md
[linguist-pr]: https://github.com/github/linguist/pull/5968
[mdn-css-selectors]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
[ubo-filters]: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
[ubo-procedural]: https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters
[ubo-scriptlets]: https://github.com/gorhill/uBlock/wiki/Resources-Library#available-general-purpose-scriptlets
[ubo-url]: https://github.com/gorhill/uBlock
[vscode-extension]: https://marketplace.visualstudio.com/items?itemName=adguard.adblock
