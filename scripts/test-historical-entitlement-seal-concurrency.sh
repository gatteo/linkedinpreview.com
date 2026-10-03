#!/usr/bin/env bash
set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${HISTORICAL_ENTITLEMENT_SEAL_CONCURRENCY_TEST_PG_PORT:-55439}"
DATA_DIR="$(mktemp -d /tmp/lp-historical-entitlement-seal-concurrency.XXXXXX)"
DB_NAME="lp_historical_entitlement_seal_concurrency_test"
INSERT_OUTPUT="$DATA_DIR/late-approval.out"

cleanup() {
    "$PG_BIN/pg_ctl" -D "$DATA_DIR" -m immediate stop >/dev/null 2>&1 || true
    rm -rf "$DATA_DIR"
}
trap cleanup EXIT

for command in initdb pg_ctl createdb psql; do
    test -x "$PG_BIN/$command" || {
        printf 'Missing PostgreSQL test dependency: %s\n' "$PG_BIN/$command" >&2
        exit 1
    }
done

"$PG_BIN/initdb" -D "$DATA_DIR" --auth=trust --no-locale >/dev/null
LC_ALL=en_US.UTF-8 "$PG_BIN/pg_ctl" -D "$DATA_DIR" -o "-p $PORT" -w start >/dev/null
"$PG_BIN/createdb" -p "$PORT" "$DB_NAME"
PSQL=("$PG_BIN/psql" -p "$PORT" -d "$DB_NAME" -v ON_ERROR_STOP=1)

"${PSQL[@]}" -c "
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as 'select null::uuid';
" >/dev/null
"${PSQL[@]}" -f supabase/migrations/018_billing.sql >/dev/null
"${PSQL[@]}" -f supabase/migrations/027_entitlement_recovery.sql >/dev/null
"${PSQL[@]}" -f supabase/migrations/029_historical_entitlement_reconciliation.sql >/dev/null
"${PSQL[@]}" -c "
    insert into auth.users (id, email_confirmed_at) values
        ('00000000-0000-0000-0000-0000000000a1', now()),
        ('00000000-0000-0000-0000-0000000000b2', now());
    insert into public.billing_entitlement_reconciliation_runs (
        id, cutoff_at, manifest_digest, expected_paid_account_count,
        expected_paid_checkout_session_count, approved_by, approved_at
    ) values (
        '20000000-0000-0000-0000-000000000004', now(), 'seal-race-manifest-v1', 1, 1,
        'human-review', now()
    );
    insert into public.billing_entitlement_reconciliation_approvals (
        reconciliation_run_id, disposition, plan, stripe_checkout_session_id,
        stripe_customer_id, origin_user_id, stripe_created_at, canonical_status,
        status_observed_at, evidence_digest, reviewed_by, reviewed_at, expires_at
    ) values (
        '20000000-0000-0000-0000-000000000004', 'approved_import', 'lifetime',
        'cs_seal_race_seed', 'cus_seal_race_seed', '00000000-0000-0000-0000-0000000000a1',
        now(), 'active', now(), 'seed-evidence-v1', 'human-review', now(), now() + interval '15 minutes'
    );
    create function public.zz_pause_reconciliation_approval_insert() returns trigger language plpgsql as \$\$
    begin
        perform pg_sleep(2);
        return new;
    end;
    \$\$;
    create trigger zz_pause_reconciliation_approval_insert
    before insert on public.billing_entitlement_reconciliation_approvals
    for each row execute function public.zz_pause_reconciliation_approval_insert();
" >/dev/null

"${PSQL[@]}" -c "
    insert into public.billing_entitlement_reconciliation_approvals (
        reconciliation_run_id, disposition, plan, origin_user_id, canonical_status,
        status_observed_at, evidence_digest, reviewed_by, reviewed_at, exception_reason
    ) values (
        '20000000-0000-0000-0000-000000000004', 'manual_exception', 'lifetime',
        '00000000-0000-0000-0000-0000000000b2', 'active', now(), 'late-evidence-v1',
        'human-review', now(), 'must not join sealed manifest'
    );
" >"$INSERT_OUTPUT" 2>&1 &
insert_pid=$!
sleep 1
"${PSQL[@]}" -c "select public.seal_historical_entitlement_reconciliation('20000000-0000-0000-0000-000000000004');" >"$DATA_DIR/seal.out" 2>&1 &
seal_pid=$!

set +e
wait "$insert_pid"
insert_status=$?
wait "$seal_pid"
seal_status=$?
set -e

if [[ "$insert_status" -ne 0 ]]; then
    printf 'Approval that started before the seal attempt must retain serial order.\n' >&2
    exit 1
fi
if [[ "$seal_status" -eq 0 ]]; then
    printf 'Concurrent seal unexpectedly accepted a manifest mutated by the preceding approval insert.\n' >&2
    exit 1
fi
if ! grep -q 'Historical reconciliation manifest incomplete' "$DATA_DIR/seal.out"; then
    printf 'Concurrent seal did not fail at the frozen-manifest boundary.\n' >&2
    exit 1
fi

"${PSQL[@]}" -c "
    do \$\$
    declare
        v_approvals integer;
        v_sealed_at timestamptz;
    begin
        select count(*) into v_approvals
        from public.billing_entitlement_reconciliation_approvals
        where reconciliation_run_id = '20000000-0000-0000-0000-000000000004';
        select sealed_at into v_sealed_at
        from public.billing_entitlement_reconciliation_runs
        where id = '20000000-0000-0000-0000-000000000004';
        if v_approvals <> 2 or v_sealed_at is not null then
            raise exception 'seal race serial-order invariant failed: approvals %, sealed %',
                v_approvals, v_sealed_at;
        end if;
    end
    \$\$;
" >/dev/null

printf 'Historical entitlement seal concurrency integration passed.\n'
