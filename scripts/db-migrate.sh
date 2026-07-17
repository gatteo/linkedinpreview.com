#!/usr/bin/env bash
# Apply SQL migration file(s) to the Supabase Postgres database.
#
# Usage:   pnpm db:migrate supabase/migrations/011_linkedin_login.sql
#          pnpm db:migrate supabase/migrations/0*.sql      # (careful: re-runs)
#
# Requires SUPABASE_DB_URL in .env — get it from the Supabase dashboard:
#   Project Settings > Database > Connection string > URI
#   (the "Session pooler" URI is the most reliable for running DDL).
#
# Migrations are applied with ON_ERROR_STOP so a failure aborts immediately and
# leaves nothing half-applied. This runs raw SQL files; it does not use the
# Supabase CLI migration-history table (this project's 001–010 were applied
# out-of-band, so history tracking would be out of sync).
set -euo pipefail

# psql ships via Homebrew's keg-only libpq.
export PATH="/opt/homebrew/opt/libpq/bin:${PATH}"

# Read SUPABASE_DB_URL from .env without executing the file (some lines may not
# be valid shell assignments).
if [ -z "${SUPABASE_DB_URL:-}" ] && [ -f .env ]; then
    SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env | tail -1 | sed -E 's/^SUPABASE_DB_URL=//; s/^"(.*)"$/\1/')"
fi

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL in .env (Supabase > Project Settings > Database > Connection string > URI)}"

if [ "$#" -eq 0 ]; then
    echo "usage: pnpm db:migrate <file.sql> [more.sql ...]" >&2
    exit 2
fi

for f in "$@"; do
    echo "==> applying ${f}"
    psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -f "${f}"
done

echo "==> done"
