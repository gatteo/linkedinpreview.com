#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" gate. Wired through `ignoreCommand` in vercel.json.
#
#   exit 0 -> skip the build (no build minutes spent)
#   exit 1 -> run the build
#
# The gate only skips commits whose diff cannot change the deployed output.
# It fails open: anything it cannot determine gets built.

set -u

log() { echo "[build-gate] $*"; }

# Paths that never reach the build output. Everything else forces a build.
# Note `*.md` does not match `*.mdx` - blog/changelog/compare content is a build input.
IGNORED_PATHS=(
    ':(exclude)docs'
    ':(exclude)*.md'
    ':(exclude).github'
    ':(exclude).husky'
    ':(exclude).claude'
    ':(exclude).agents'
    ':(exclude).cursor'
    ':(exclude)LICENCE'
    ':(exclude).prettierignore'
)

COMMIT_MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"

# Escape hatch: force a build regardless of what changed.
case "$COMMIT_MSG" in
*'[deploy]'*)
    log 'building: [deploy] override in commit message'
    exit 1
    ;;
esac

# Prefer the SHA of the last successful deployment - Vercel exposes it only when an
# ignore step is configured. It is the honest baseline: HEAD^ would miss changes from
# any commit that was itself skipped.
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE" ] || ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
    BASE='HEAD^'
fi

if ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
    log "building: no usable diff base (shallow clone or first commit)"
    exit 1
fi

if git diff --quiet "$BASE" HEAD -- . "${IGNORED_PATHS[@]}"; then
    log "skipping: ${BASE}..HEAD touches only non-building paths"
    git diff --name-only "$BASE" HEAD | sed 's/^/[build-gate]   /'
    exit 0
fi

log "building: ${BASE}..HEAD changes build inputs"
exit 1
