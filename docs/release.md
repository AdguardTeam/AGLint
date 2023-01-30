# Release process

This document describes the release process for the new versions of the AGLint library.

1. Update the version number in the `package.json` file regarding the [semver](https://semver.org/) rules.
2. Fill the `CHANGELOG.md` file with the changes made since the last release by following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) rules.
3. Push the changes to the `master` branch.
4. Create a new tag with the version number (e.g. `v1.0.0`) to trigger the [release workflow](https://github.com/AdguardTeam/AGLint/blob/master/.github/workflows/release.yml).
