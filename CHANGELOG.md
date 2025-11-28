# AGLint Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic Versioning].

[Keep a Changelog]: https://keepachangelog.com/en/1.0.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html

## [Unreleased]

### Added

- JSON schema for config files. [#210]
- Configuration field for compatibility flags. [#230]

### Removed

- `syntax` field from config files.

[Unreleased]: https://github.com/AdguardTeam/AGLint/compare/v4.0.0-alpha.8...HEAD
[#210]: https://github.com/AdguardTeam/AGLint/issues/210
[#230]: https://github.com/AdguardTeam/AGLint/issues/230

## [4.0.0-alpha.8] - 2025-11-24

### Added

- JSON reporters and `--reporter` CLI option.
- `LinterConfigCommentType` enum to public exports.
- `getLinterConfigHash` to public exports.
- Debugger utilities to public exports.

### Changed

- `FixApplier` class to standalone `applyFixes` function.
- Improved and simplified debugging.
- Improved invalid config detection.
- Freeze ASTs to avoid side effects.
- Sort file paths alphabetically in reporters.
- Improved rule documentation handling.

### Fixed

- `changed` method in config resolver.
- Deep merging for rule config array.

### Removed

- `getAglintRuleDocumentationUrl` from public exports.

[4.0.0-alpha.8]: https://github.com/AdguardTeam/AGLint/compare/v4.0.0-alpha.7...v4.0.0-alpha.8


## [4.0.0-alpha.7] - 2025-11-19

### Added

- `hasErrors`, `assertLinterFixCommand`, `assertLinterSuggestions`,
  `isLinterFixCommand`, `isLinterSuggestions` helpers.

[4.0.0-alpha.7]: https://github.com/AdguardTeam/AGLint/compare/v4.0.0-alpha.6...v4.0.0-alpha.7

## [4.0.0-alpha.6] - 2025-11-19

### Added

- Ability to print config for a file. [#158]
- `no-css-comments` linter rule. [#235]
- Debug mode with comprehensive logging. [#199]
- Support for `package.json` configuration file. [#245]

[4.0.0-alpha.6]: https://github.com/AdguardTeam/AGLint/compare/v4.0.0-alpha.5...v4.0.0-alpha.6
[#158]: https://github.com/AdguardTeam/AGLint/issues/158
[#235]: https://github.com/AdguardTeam/AGLint/issues/235
[#199]: https://github.com/AdguardTeam/AGLint/issues/199
[#245]: https://github.com/AdguardTeam/AGLint/issues/245

## [4.0.0-alpha.5] - 2025-11-03

### Added

- More exports.

## [4.0.0-alpha.4] - 2025-11-03

### Added

- Support for NodeNext ESM resolution in `.d.ts` files.

## [4.0.0-alpha.3] - 2025-11-03

### Changed

- Renamed CLI entry point file for clarity.

### Fixed

- Build config.

## [4.0.0-alpha.2] - 2025-11-03

### Changed

- Split exports into `@adguard/aglint/linter` and `@adguard/aglint/cli`.

## [4.0.0-alpha.1] - 2025-10-31

### Fixed

- Preset files are now included in the tarball.

## [4.0.0-alpha.0] - 2025-10-31

### Added

- Support for multi-threaded linting. [#208]
- Autofix and Suggestions API. [#200]
- Possibility to detect unused disable comments. [#197]
- Cache for previous linting results. [#188]
- `scriptlet-quotes` linter rule. [#258]
- `no-duplicated-css-declaration-props` linter rule. [#234]
- `no-unsupported-css-pseudo-class` linter rule. [#205]

### Changed

- Linter core and CLI are completely rewritten, API is changed.
- Library exports are completely changed because of the new API.
- Minimum Node.js version is `v20`.
- Implemented more performant walking. [#241]
- Improved rule management via rules registry. [#217]
- Linter rules are renamed, now they have consistent names. [#231]
- Improved CLI experience. CLI now accepts glob patterns, directories, and files. [#198]
- Replaced `superstruct` with `valibot`. [#218]
- Moved rule documentations to the `docs/rules` directory. [#72]

[4.0.0-alpha.0]: https://github.com/AdguardTeam/AGLint/compare/v3.0.0...v4.0.0-alpha.0
[#72]: https://github.com/AdguardTeam/AGLint/issues/72
[#188]: https://github.com/AdguardTeam/AGLint/issues/188
[#197]: https://github.com/AdguardTeam/AGLint/issues/197
[#198]: https://github.com/AdguardTeam/AGLint/issues/198
[#200]: https://github.com/AdguardTeam/AGLint/issues/200
[#205]: https://github.com/AdguardTeam/AGLint/issues/205
[#208]: https://github.com/AdguardTeam/AGLint/issues/208
[#217]: https://github.com/AdguardTeam/AGLint/issues/217
[#218]: https://github.com/AdguardTeam/AGLint/issues/218
[#231]: https://github.com/AdguardTeam/AGLint/issues/231
[#234]: https://github.com/AdguardTeam/AGLint/issues/234
[#241]: https://github.com/AdguardTeam/AGLint/issues/241
[#258]: https://github.com/AdguardTeam/AGLint/issues/258

## [3.0.0] - 2025-05-21

### Changed

- Project become ESM-only.
- Minimum Node.js version is `v18`.
- The build structure has been updated: files are no longer bundled. Users can handle bundling as needed.
- Updated [@adguard/agtree] to `v3.1.4` [#247].

### Fixed

- zod vulnerability issue [#250].

### Removed

- Legacy `umd` and `iife` builds.

[3.0.0]: https://github.com/AdguardTeam/AGLint/compare/v2.1.5...v3.0.0
[#247]: https://github.com/AdguardTeam/AGLint/issues/247
[#250]: https://github.com/AdguardTeam/AGLint/issues/250

## [2.1.5] - 2025-05-05

### Added

- Support of `cli` platform [#251].

[2.1.5]: https://github.com/AdguardTeam/AGLint/compare/v2.1.4...v2.1.5
[#251]: https://github.com/AdguardTeam/AGLint/issues/251

## [2.1.4] - 2025-03-31

### Added

- Support for `!+ NOT_VALIDATE` hint [#248].

[2.1.4]: https://github.com/AdguardTeam/AGLint/compare/v2.1.3...v2.1.4
[#248]: https://github.com/AdguardTeam/AGLint/issues/248

## [2.1.3] - 2024-12-19

## Added

- Support for ABP CSS injections [#224].

## Changed

- Updated [@adguard/agtree] to `v2.3.0`.

[2.1.3]: https://github.com/AdguardTeam/AGLint/compare/v2.1.2...v2.1.3
[#224]: https://github.com/AdguardTeam/AGLint/issues/224

## [2.1.2] - 2024-11-25

### Fixed

- `npx aglint init` does not work [#225].

[2.1.2]: https://github.com/AdguardTeam/AGLint/compare/v2.1.1...v2.1.2
[#225]: https://github.com/AdguardTeam/AGLint/issues/225


## [2.1.1] - 2024-09-20

### Added

- Support of `ext_chromium_mv3` as a known platform for `PLATFORM` and `NOT_PLATFORM` hints [#220].

[2.1.1]: https://github.com/AdguardTeam/AGLint/compare/v2.1.0...v2.1.1
[#220]: https://github.com/AdguardTeam/AGLint/issues/220

## [2.1.0] - 2024-09-11

### Added

- Various CSSTree utilities.
- [`@adguard/ecss-tree`][ecss-tree] library to work with CSS and Extended CSS syntax.
- `no-invalid-css-syntax` linter rule to check CSS syntax in `adblock` rules.
- `no-invalid-css-declaration` linter rule to check valid CSS declarations in `adblock` rules.

### Changed

- Since AGTree v2 no longer parses the full CSS syntax as AGTree v1 did,
  we now use the [@adguard/ecss-tree][ecss-tree] library to maintain the same functionality.
  Additionally, we provide a special layer for CSS handling in the linter core.
- More semantic parsing error messages.
- Changed module type to CJS.
- Updated [@adguard/agtree] to `v2.0.2` [#215]. From this major version, AGTree no longer parses all CSS syntax,
  so we need to use a separate library for this purpose in the linter.

### Fixed

- Improved exports in `package.json`.

[#215]: https://github.com/AdguardTeam/AGLint/issues/215
[ecss-tree]: https://github.com/AdguardTeam/ecsstree
[2.1.0]: https://github.com/AdguardTeam/AGLint/compare/v2.0.10...v2.1.0

## [2.0.10] - 2024-09-04

### Added

- `no-excluded-rules` linter rule [#214].

[#214]: https://github.com/AdguardTeam/AGLint/issues/214
[2.0.10]: https://github.com/AdguardTeam/AGLint/compare/v2.0.9...v2.0.10

## [2.0.9] - 2024-04-25

### Fixed

- Validation for `$permissions` modifier [#206].

### Changed

- Updated [@adguard/agtree] to `v1.1.8`.

[#206]: https://github.com/AdguardTeam/AGLint/issues/206
[2.0.9]: https://github.com/AdguardTeam/AGLint/compare/v2.0.8...v2.0.9


## [2.0.8] - 2024-01-09

### Fixed

- Absolute paths in the CLI [#184].

[#184]: https://github.com/AdguardTeam/AGLint/issues/184
[2.0.8]: https://github.com/AdguardTeam/AGLint/compare/v2.0.6...v2.0.8


## [2.0.6] - 2023-11-07

### Added

- Support of `!#else` preprocessor directive [#185].

### Changed

- Updated [@adguard/agtree] to `v1.1.7`.

[#185]: https://github.com/AdguardTeam/AGLint/issues/185
[2.0.6]: https://github.com/AdguardTeam/AGLint/compare/v2.0.5...v2.0.6


## [2.0.5] - 2023-09-07

### Changed

- Updated [@adguard/agtree] to `v1.1.5`.

[2.0.5]: https://github.com/AdguardTeam/AGLint/compare/v2.0.4...v2.0.5


## [2.0.4] - 2023-08-30

### Changed

- Override `config.extends`'s presets by the user config.
- Updated [@adguard/agtree] to `v1.1.4`.

[2.0.4]: https://github.com/AdguardTeam/AGLint/compare/v2.0.3...v2.0.4


## [2.0.3] - 2023-08-29

### Added

- Config `syntax` handling during `aglint init`.
- `no-short-rules` linter rule.
- Validation of modifier values due to `value_format`.

### Changed

- Updated [@adguard/agtree] to `v1.1.3`.

[2.0.3]: https://github.com/AdguardTeam/AGLint/compare/v2.0.1...v2.0.3


## [2.0.1] - 2023-08-14

### Changed

- Make `syntax` property in the config required.
- Updated [@adguard/agtree] to `v1.1.2`.

[2.0.1]: https://github.com/AdguardTeam/AGLint/compare/v2.0.0...v2.0.1


## [2.0.0] - 2023-08-11

### Added

- Basic rule modifiers validation.
- `invalid-modifiers` linter rule.

### Changed

- Updated [@adguard/agtree] to `v1.1.1`.

[2.0.0]: https://github.com/AdguardTeam/AGLint/compare/v1.0.11...v2.0.0


## [1.0.11] - 2023-04-21

### Added

- `aglint init` command to create a default config file.
- Config finder logic.
- Extendable configs.

### Changed

- Config files are now required to run the linter.
- Locations are handled in linter rules.

[1.0.11]: https://github.com/AdguardTeam/AGLint/compare/v1.0.10...v1.0.11


## [1.0.10] - 2023-03-30

### Added

- Logical expression parser.
- Dedicated filter list parser.
- Support for uBO media queries [#10].

### Changed

- Parser refactoring.
- Some small code improvements.
- Added location information to all nodes.
- Changed AST structure to be more consistent.

### Removed

- Temporary removed `adg-scriptlet-quotes` linter rule.

[#10]: https://github.com/AdguardTeam/AGLint/issues/10
[1.0.10]: https://github.com/AdguardTeam/AGLint/compare/v1.0.9...v1.0.10


## [1.0.9] - 2023-03-02

### Added

- `unknown-preprocessor-directives` linter rule.
- `inconsistent-hint-platforms` linter rule.
- `invalid-domain-list` linter rule.
- `unknown-hints-and-platforms` linter rule.
- `duplicated-hints` linter rule.
- `duplicated-hint-platforms` linter rule.
- `exception` property to modifier list parser.

### Changed

- Detailed error messages when linter config parsing fails.
- Migrate from CSSTree to ECSSTree in order to fully support Extended CSS selectors parsing.
- Changed license to MIT.

### Fixed

- Network rule separator finder sometimes found the wrong separator.

[1.0.9]: https://github.com/AdguardTeam/AGLint/compare/v1.0.8...v1.0.9


## [1.0.8] - 2023-02-13

### Changed

- Improved console reporter, shows linter rule name when reporting problems.
- Detailed error messages when CSS parsing fails.

[1.0.8]: https://github.com/AdguardTeam/AGLint/compare/v1.0.7...v1.0.8


## [1.0.7] - 2023-02-10

### Fixed

- CLI exit code is now 1 if there are any linter errors.

<!-- v1.0.6 is the "oldest" tag -->
<!-- that's why the list of links starts with [1.0.7] -->
<!-- i.e. it is impossible to create compare url for 1.0.5 and 1.0.6 -->
[1.0.7]: https://github.com/AdguardTeam/AGLint/compare/v1.0.6...v1.0.7


## 1.0.6 - 2023-02-06

### Added

- Export Linter CLI to public API.


## 1.0.5 - 2023-01-30

### Added

- Initial version of the linter and CLI.
- Initial version of the adblock rule parser.

[@adguard/agtree]: https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/agtree/CHANGELOG.md
