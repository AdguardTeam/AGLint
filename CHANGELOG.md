# AGLint Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.11] - 2023-04-21

### Added

- Added `aglint init` command to create a default config file.
- Config finder logic.
- Extendable configs.

### Changed

- Config files are now required to run the linter.
- Locations are handled in linter rules.

## [1.0.10] - 2023-03-30

### Added

- Added logical expression parser.
- Added dedicated filter list parser.
- Added support for uBO media queries (https://github.com/AdguardTeam/AGLint/issues/10).

### Changed

- Parser refactoring.
- Some small code improvements.
- Added location information to all nodes.
- Changed AST structure to be more consistent.

### Removed

- Temporary removed `adg-scriptlet-quotes` linter rule.

## [1.0.9] - 2023-03-02

### Added

- Added `unknown-preprocessor-directives` linter rule.
- Added `inconsistent-hint-platforms` linter rule.
- Added `invalid-domain-list` linter rule.
- Added `unknown-hints-and-platforms` linter rule.
- Added `duplicated-hints` linter rule.
- Added `duplicated-hint-platforms` linter rule.
- Added `exception` property to modifier list parser.

### Changed

- Detailed error messages when linter config parsing fails.
- Migrate from CSSTree to ECSSTree in order to fully support Extended CSS selectors parsing.
- Changed license to MIT.

### Fixed

- Network rule separator finder sometimes found the wrong separator.

## [1.0.8] - 2023-02-13

### Changed

- Improved console reporter, shows linter rule name when reporting problems.
- Detailed error messages when CSS parsing fails.

## [1.0.7] - 2023-02-10

### Fixed

- CLI exit code is now 1 if there are any linter errors.

## [1.0.6] - 2023-02-06

### Added

- Export Linter CLI to public API.

## [1.0.5] - 2023-01-30

### Added

- Initial version of the linter and CLI.
- Initial version of the adblock rule parser.
