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

**Table of Contents:**

- [Introduction](#introduction)
- [Features](#features)
- [Quick Start](#quick-start)
    - [Install AGLint](#install-aglint)
    - [Install VSCode Extension](#install-vscode-extension)
    - [Repository integration](#repository-integration)
- [Linter rules](#linter-rules)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Introduction

AGLint is a universal linter for adblock filter lists.
It supports all major syntaxes and can be used as a CLI tool
or as a TypeScript/JavaScript library.

Our goal is to make it easy to create and maintain clean, valid filter lists.  
AGLint's philosophy is highly inspired by [ESLint][eslint].
If you know ESLint, you'll feel at home with AGLint.

[eslint]: https://eslint.org/

## Features

- 🧠 **Built-in rules** — detect syntax errors, invalid domains, CSS issues, and more  
- 🛠️ **Auto-fixing and suggestions** — automatically fix issues or get suggestions for manual fixes  
- 🎯 **Granular fix control** — limit fixes by rule type or specific rules  
- 🌐 **Multi-syntax support** — AdGuard, uBlock Origin, Adblock Plus, AdBlock  
- 🎨 **Platform-specific validation** — validate rules for specific adblock products and platforms  
- ⚙️ **Flexible configuration** — `.aglintrc`, `.aglintrc.json`, `package.json` with inheritance  
- 💬 **Inline configuration comments** — enable/disable rules directly in filter lists  
- 🧙 **Interactive setup wizard** — quick config file generation with `--init`  
- 🚫 **Smart ignoring** — `.aglintignore` with glob patterns and inline disable directives  
- 🔍 **Unused directive detection** — find and report unnecessary disable comments  
- ⚡ **High performance** — multi-threaded linting with intelligent caching  
- 📊 **Multiple output formats** — console and JSON reporters  
- 🐛 **Debug mode** — comprehensive logging for troubleshooting  
- 🔧 **Config inspection** — view effective configuration for any file  
- 🖥️ **Editor integration** — VSCode extension for real-time linting  
- 💡 **Dual API** — CLI tool and TypeScript/JavaScript library

## Quick Start

### Install AGLint

**Prerequisites:** [Node.js][nodejs]

```bash
# Install
npm install -D @adguard/aglint

# Initialize configuration
npx aglint --init

# Run linter
npx aglint
```

That's it! AGLint will scan your filter lists and report any issues.

**You can also lint specific files, glob patterns, or directories:**

```bash
npx aglint filters/social.txt 'filters/privacy/*.txt' filters/security/
```

**Auto-fix issues:**

```bash
npx aglint --fix
```

**See all options:**

```bash
npx aglint --help
```

[nodejs]: https://nodejs.org/

### Install VSCode Extension

We provide a VSCode extension offering full adblock filter list syntax support.
It is available on the [VSCode Marketplace][vscode-marketplace] and [Open VSX][open-vsx].

The extension provides:

- Syntax highlighting
- Real-time linting using AGLint
- Inline error and warning display

GitHub Linguist [also uses][linguist-pr] this extension for adblock list syntax highlighting on GitHub.

**We strongly recommend using this extension if you are working with adblock filter lists.**

[linguist-pr]: https://github.com/github/linguist/pull/5968
[vscode-marketplace]: https://marketplace.visualstudio.com/items?itemName=adguard.adblock
[open-vsx]: https://open-vsx.org/extension/adguard/adblock

### Repository integration

Read the [integration guide][integration-guide] for details on how to integrate AGLint into your repository.

[integration-guide]: https://github.com/AdguardTeam/AGLint/blob/master/docs/repo-integration.md

## Linter rules

See [docs/rules folder][rule-list] for a full list of built-in rules and their descriptions.

[rule-list]: https://github.com/AdguardTeam/AGLint/blob/master/docs/rules/

## Documentation

For all available documentation, see the [docs folder][docs-folder].

[docs-folder]: https://github.com/AdguardTeam/AGLint/blob/master/docs/

## Contributing

Please read the [CONTRIBUTING.md][contributing-url] file for details on how to contribute to this project.

[contributing-url]: https://github.com/AdguardTeam/AGLint/tree/master/CONTRIBUTING.md

## License

MIT License. See [LICENSE][aglint-license] for details.

[aglint-license]: https://github.com/AdguardTeam/AGLint/blob/master/LICENSE

---

<sub>Made with ❤️ by [AdGuard](https://adguard.com)</sub>
