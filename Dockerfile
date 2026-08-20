# Multi-stage Dockerfile for aglint
# Dependencies are cached until package.json/pnpm-lock.yaml change
# Each stage can be built independently via --target

FROM adguard/node-ssh:22.22--0 AS base
SHELL ["/bin/bash", "-lc"]

WORKDIR /aglint

# pnpm store directory — set once here, no need for pnpm config set in every RUN
ENV npm_config_store_dir=/pnpm-store

# ============================================================================
# Stage: deps
# Cached until package.json/pnpm-lock.yaml changes
# ============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --ignore-scripts: skips husky install (prepare script) which must not run
# inside Docker (no git hooks needed in CI)
RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    pnpm install \
        --frozen-lockfile \
        --ignore-scripts \
        --prefer-offline

# ============================================================================
# Stage: source
# Full source copy — parent for all lint/test/build stages
# ============================================================================
FROM deps AS source

COPY . /aglint

# ============================================================================
# Stage: test-output
# Runs lint, builds the library, and runs vitest unit tests.
# Used as the CI validation target: `docker build --target test-output .`
# fails if lint, build, or tests fail.
# ============================================================================
FROM source AS test-output

# BUILD_RUN_ID is written to a temp file to bust the BuildKit cache for each
# CI build run, ensuring this stage is never served from a stale cache.
ARG BUILD_RUN_ID=""

RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    pnpm lint && \
    pnpm build && \
    pnpm test

# ============================================================================
# Stage: build
# Builds the library and creates the npm package tarball for publishing
# ============================================================================
FROM source AS build

# BUILD_RUN_ID is written to a temp file to bust the BuildKit cache for each
# CI build run, ensuring this stage is never served from a stale cache.
ARG BUILD_RUN_ID=""

# Optional package version for local builds. CI injects the release version
# into package.json before building the image; locally this arg is required
# because package.json has no version field and pnpm pack needs one.
ARG VERSION=""

RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    if [ -n "${VERSION}" ]; then npm pkg set version="${VERSION}"; fi && \
    pnpm build && \
    pnpm pack --out aglint.tgz && \
    mkdir -p /out/artifacts && \
    mv aglint.tgz /out/artifacts/

FROM scratch AS build-output
COPY --from=build /out/artifacts/ /
