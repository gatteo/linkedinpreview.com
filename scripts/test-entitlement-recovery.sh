#!/usr/bin/env bash
set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${ENTITLEMENT_TEST_PG_PORT:-55433}"
DATA_DIR="$(mktemp -d /tmp/lp-entitlement-recovery.XXXXXX)"
DB_NAME="lp_entitlements_test"

cleanup() {
    "$PG_BIN/pg_ctl" -D "$DATA_DIR" -m immediate stop >/dev/null 2>&1 || true
    rm -rf "$DATA_DIR"
}
trap cleanup EXIT

for command in initdb pg_ctl createdb dropdb psql; do
    test -x "$PG_BIN/$command" || {
        printf 'Missing PostgreSQL test dependency: %s\n' "$PG_BIN/$command" >&2
        exit 1
    }
done

"$PG_BIN/initdb" -D "$DATA_DIR" --auth=trust --no-locale >/dev/null
LC_ALL=en_US.UTF-8 "$PG_BIN/pg_ctl" -D "$DATA_DIR" -o "-p $PORT" -w start >/dev/null
"$PG_BIN/createdb" -p "$PORT" "$DB_NAME"

"$PG_BIN/psql" -p "$PORT" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as 'select null::uuid';
" >/dev/null

"$PG_BIN/psql" -p "$PORT" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f supabase/migrations/018_billing.sql >/dev/null
"$PG_BIN/psql" -p "$PORT" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f supabase/migrations/027_entitlement_recovery.sql >/dev/null
"$PG_BIN/psql" -p "$PORT" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f tests/entitlement-recovery-replay.sql >/dev/null

printf 'Entitlement replay integration passed.\n'
