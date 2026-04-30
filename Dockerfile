# Multi-stage Dockerfile for aglint CI optimization
# Dependencies are cached until package.json/pnpm-lock.yaml change
# Each stage can be built independently via --target

FROM adguard/node-ssh:22.14--0 AS base
SHELL ["/bin/bash", "-lc"]

RUN npm install -g pnpm@10.7.1

WORKDIR /aglint

# Use the npm_config_ prefix to set pnpm store-dir; this is the correct env var
# that pnpm reads — ENV PNPM_STORE is ignored by pnpm.
ENV npm_config_store_dir=/pnpm-store

# ============================================================================
# Stage: deps
# Cached until package.json/pnpm-lock.yaml changes
# ============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# --ignore-scripts: package.json has "prepare": "node .husky/install.mjs"
# which must not run inside Docker (no git hooks needed in CI).
RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    pnpm install --frozen-lockfile --ignore-scripts

# ============================================================================
# Stage: source
# Cached until source code changes
# ============================================================================
FROM deps AS source

COPY . /aglint

# ============================================================================
# Stage: lint
# Runs type checking and linting (includes markdownlint via pnpm lint)
# ============================================================================
FROM source AS lint

# BUILD_RUN_ID is written to a temp file to bust the BuildKit cache for each
# Bamboo build run, ensuring this stage is never served from a stale cache.
ARG BUILD_RUN_ID=""

RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    mkdir -p /out && \
    pnpm lint && \
    touch /out/lint.txt

FROM scratch AS lint-output
COPY --from=lint /out/ /

# ============================================================================
# Stage: test
# Runs type checking and vitest
# ============================================================================
FROM source AS test

# BUILD_RUN_ID is written to a temp file to bust the BuildKit cache for each
# Bamboo build run, ensuring this stage is never served from a stale cache.
ARG BUILD_RUN_ID=""

# Suppress the original exit code so Docker commits the layer with exit-code.txt.
# See bamboo-specs/test.yaml for how exit-code.txt is consumed.
RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    mkdir -p /out && \
    pnpm check-types && pnpm test ; \
    echo $? > /out/exit-code.txt

FROM scratch AS test-output
COPY --from=test /out/ /

# ============================================================================
# Stage: full-build
# Runs quality gates then builds library and packs .tgz for npm publish
# ============================================================================
FROM source AS full-build

# BUILD_RUN_ID is written to a temp file to bust the BuildKit cache for each
# Bamboo build run, ensuring this stage is never served from a stale cache.
ARG BUILD_RUN_ID=""

RUN --mount=type=cache,target=/pnpm-store,id=aglint-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    pnpm check-types && \
    pnpm lint && \
    pnpm test && \
    pnpm build && \
    mkdir -p /out/artifacts && \
    pnpm pack --out /out/artifacts/aglint.tgz && \
    cp dist/build.txt /out/artifacts/

FROM scratch AS full-build-output
COPY --from=full-build /out/ /
