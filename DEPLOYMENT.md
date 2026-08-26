# Deployment — @adguard/aglint

- [Deployment Summary](#deployment-summary)
- [Release Pipeline](#release-pipeline)
- [CI/CD](#cicd)
- [Environment Variables](#environment-variables)
- [Infrastructure Dependencies](#infrastructure-dependencies)
- [Integrations](#integrations)
- [Error Reporting](#error-reporting)
- [Docker Build](#docker-build)

## Deployment Summary

| Parameter              | Value                    |
| ---------------------- | ------------------------ |
| **npm package**        | `@adguard/aglint`        |
| **Artifact**           | `aglint.tgz`             |
| **Public mirror**      | `AdguardTeam/AGLint`     |
| **GitHub environment** | `npm`                    |
| **Slack channel**      | `#adguard-extension-vcs` |
| **Runner label**       | `team-extensions`        |

## Release Pipeline

Releases follow the shared [ext-shared-actions][ext-shared-actions] pipeline.
For the full step-by-step documentation, see
[publish-release.md](https://github.com/AdGuardSoftwareLimited/ext-shared-actions/blob/master/docs/publish-release.md).

In short:

1. A maintainer runs `prepare-release.yml` manually with a target tag
   (e.g. `v3.1.0`) to open a release-bump PR that finalizes `CHANGELOG.md`.
2. Merging the release-bump PR triggers `publish-release.yml`, which tags
   the release commit, builds and tests in Docker, publishes to npm via OIDC
   trusted publishing (gated by the `npm` GitHub environment), mirrors the
   tag to `AdguardTeam/AGLint`, creates a GitHub Release with the
   changelog entries (published immediately, not a draft), and notifies
   Slack (`#adguard-extension-vcs`).

Prerelease tags (e.g. `v3.1.0-alpha.1`, `v3.1.0-beta.1`) are published to npm
under a matching dist-tag (`alpha`, `beta`) instead of `latest` — this
replaces the separate `npmjs • alpha` and `npmjs • beta` environments used in
the legacy Bamboo deployment.

## CI/CD

| Workflow              | Trigger                               | Purpose                                          |
| --------------------- | ------------------------------------- | ------------------------------------------------ |
| `ci.yml`              | PRs and pushes to `master`            | Lint, test, build in Docker; upload `aglint.tgz` |
| `prepare-release.yml` | Manual (`workflow_dispatch` with tag) | Open a release-bump PR finalizing `CHANGELOG.md` |
| `publish-release.yml` | Release PR merged or manual re-run    | Tag, build, npm publish, mirror, release, Slack  |
| `mirror.yml`          | Push to `master`                      | Mirror commits to `AdguardTeam/AGLint`           |

Self-hosted jobs run on the `team-extensions` runner label; the npm publish
job (`deploy-to-npm`) runs on `ubuntu-latest`. All workflows reuse the
shared pipeline definitions from
[AdGuardSoftwareLimited/ext-shared-actions][ext-shared-actions] and
[AdGuardSoftwareLimited/actions][actions].

**Concurrency**: `ci.yml` uses a concurrency group
`ci-ext-aglint-${{ github.ref }}` with `cancel-in-progress: true` to
prevent redundant CI runs when a new push arrives for the same ref.
`publish-release.yml` uses a `publish-release` group with
`cancel-in-progress: false` to serialize release runs.

## Environment Variables

None. AGLint is a library / CLI tool and reads no CI-specific environment
variables at runtime. All CI/CD configuration (npm publish tokens, Octopass,
Slack webhooks) is handled by the shared workflows and does not require
per-project configuration.

## Infrastructure Dependencies

AGLint is a **stateless library / CLI** with no database, cache, or
message queue dependencies and no runtime infrastructure — the package is
consumed via the npm registry.

## Integrations

| Integration                     | Purpose               | Configuration                                      |
| ------------------------------- | --------------------- | -------------------------------------------------- |
| **npm registry**                | Package distribution  | OIDC trusted publishing via the `npm` environment  |
| **GitHub** `AdguardTeam/AGLint` | Public mirror         | Octopass OIDC; workflows disabled in the mirror    |
| **Slack**                       | Release notifications | `#adguard-extension-vcs`, managed by shared workflow |

## Error Reporting

This project does **not** use an error reporting service (Sentry, Bugsnag,
or equivalent). Errors are surfaced through linter reports and exceptions
raised to the consumer.

## Docker Build

The `Dockerfile` uses multi-stage builds based on `adguard/node-ssh:22.22--0`:

| Stage                    | Purpose           | Key Steps                                                          |
| ------------------------ | ----------------- | ------------------------------------------------------------------ |
| `base`                   | Shared foundation | Node.js 22, pnpm (from base image)                                 |
| `deps`                   | Dependency cache  | `pnpm install --frozen-lockfile --ignore-scripts`                  |
| `source`                 | Full source       | Copies project files over `deps`                                   |
| `test-output`            | CI validation     | `pnpm lint && pnpm build && pnpm test`                             |
| `build` / `build-output` | Artifact creation | `pnpm build && pnpm pack --out aglint.tgz`; outputs `.tgz` at root |

The dependency stage is cached by `package.json` and `pnpm-lock.yaml`.
The build cache (pnpm store) is mounted at `/pnpm-store` with id
`aglint-pnpm`.

### Local Build Commands

```bash
# Run CI validation (lint + build + test)
docker build --target test-output .

# Produce the release artifact
docker build --platform linux/amd64 --target build-output \
   --build-arg VERSION=0.0.0-dev --output ./artifacts .
# → ./artifacts/aglint.tgz
```

`package.json` intentionally has no `version` field — CI injects the release
version before building the image, and `pnpm pack` requires one. Pass a
placeholder via the `VERSION` build arg for local packaging.

[ext-shared-actions]: https://github.com/AdGuardSoftwareLimited/ext-shared-actions
[actions]: https://github.com/AdGuardSoftwareLimited/actions
