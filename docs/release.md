# Releasing a new version

This section describes the release process for the new versions of the AGLint
library. This process needs to be performed by maintainers only.

1. Create a new branch for the release (e.g. `release/v1.0.0`) from the `master`
   branch.
1. Fill the `CHANGELOG.md` file with the changes made since the last release by
   following the [Keep a Changelog][keepachangelog] rules, then commit changes
   as `Update changelog`.
1. Update the version number in the `package.json` file regarding the
   [semver][semver] rules, then commit changes as `Bump version to v1.0.0`.
1. Create a new pull request to the `master` branch from the release branch, and
   merge it after the review.
1. Create a new tag with the version number (e.g. `v1.0.0`) to trigger the
   [release workflow][release-workflow].
1. The release workflow will automatically publish the new version to the
   [npm registry][npm-registry].

[keepachangelog]: https://keepachangelog.com/en/1.0.0/
[npm-registry]: https://www.npmjs.com/package/@adguard/aglint
[release-workflow]: https://github.com/AdguardTeam/AGLint/blob/master/.github/workflows/release.yml
[semver]: https://semver.org/spec/v2.0.0.html
