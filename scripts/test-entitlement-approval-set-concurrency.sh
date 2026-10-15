#!/usr/bin/env bash
set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${ENTITLEMENT_APPROVAL_CONCURRENCY_TEST_PG_PORT:-55436}"
DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lp-entitlement-approval-concurrency.XXXXXX")"
DB_NAME="lp_entitlement_approval_concurrency_test"
FIRST_OUTPUT="$DATA_DIR/first.out"
SECOND_OUTPUT="$DATA_DIR/second.out"

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
"${PSQL[@]}" -f supabase/migrations/032_entitlement_recovery.sql >/dev/null
"${PSQL[@]}" -c "
    insert into auth.users (id, email_confirmed_at) values
        ('00000000-0000-0000-0000-0000000000c3', now());

    insert into public.billing_legacy_monthly_import_approvals (
        approval_id, stripe_checkout_session_id, stripe_subscription_id, stripe_customer_id,
        origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
        stripe_created_at, reviewed_at, expires_at, approved_by
    ) values (
        'legacy_monthly:sub_approval_seed', 'cs_approval_seed', 'sub_approval_seed', 'cus_approval_seed',
        '00000000-0000-0000-0000-0000000000c3', 'email-hmac-seed', 1,
        timestamptz '2026-08-29 00:00:00+00', clock_timestamp(),
        clock_timestamp() + interval '15 minutes', 'human-review'
    );

    create function public.zz_entitlement_test_pause_approval_insert() returns trigger language plpgsql as \$\$
    begin
        perform pg_sleep(2);
        return new;
    end;
    \$\$;

    create trigger zz_entitlement_test_pause_approval_insert
        before insert on public.billing_legacy_monthly_import_approvals
        for each row execute function public.zz_entitlement_test_pause_approval_insert();
" >/dev/null

insert_approval() {
    local suffix="$1"
    "${PSQL[@]}" -c "
        insert into public.billing_legacy_monthly_import_approvals (
            approval_id, stripe_checkout_session_id, stripe_subscription_id, stripe_customer_id,
            origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
            stripe_created_at, reviewed_at, expires_at, approved_by
        ) values (
            'legacy_monthly:sub_approval_${suffix}', 'cs_approval_${suffix}', 'sub_approval_${suffix}',
            'cus_approval_${suffix}', '00000000-0000-0000-0000-0000000000c3',
            'email-hmac-${suffix}', 1, timestamptz '2026-08-29 00:00:00+00', clock_timestamp(),
            clock_timestamp() + interval '15 minutes', 'human-review'
        );
    "
}

insert_approval first >"$FIRST_OUTPUT" 2>&1 &
first_pid=$!
insert_approval second >"$SECOND_OUTPUT" 2>&1 &
second_pid=$!

set +e
wait "$first_pid"
first_status=$?
wait "$second_pid"
second_status=$?
set -e

if [[ "$first_status" -eq 0 && "$second_status" -eq 0 ]]; then
    printf 'Concurrent approval inserts both succeeded; the two-record cap raced.\n' >&2
    exit 1
fi

if [[ "$first_status" -ne 0 && "$second_status" -ne 0 ]]; then
    printf 'Exactly one concurrent approval insert must succeed; got statuses %s and %s.\n' "$first_status" "$second_status" >&2
    exit 1
fi

if ! grep -q 'Only two legacy monthly approvals are permitted' "$FIRST_OUTPUT" "$SECOND_OUTPUT"; then
    printf 'Rejected concurrent approval must fail at the two-record cap.\n' >&2
    exit 1
fi

"${PSQL[@]}" -c "
    do \$\$
    declare
        v_approvals integer;
        v_subscription_id text;
        v_imports integer;
        v_replays integer;
    begin
        select count(*) into v_approvals from public.billing_legacy_monthly_import_approvals;
        if v_approvals <> 2 then
            raise exception 'approval-set cardinality invariant failed: % approvals', v_approvals;
        end if;

        select stripe_subscription_id into v_subscription_id
        from public.billing_legacy_monthly_import_approvals
        where stripe_subscription_id <> 'sub_approval_seed';
        if v_subscription_id is null then
            raise exception 'concurrent approved subscription not found';
        end if;

        perform public.import_approved_legacy_monthly_entitlement(v_subscription_id);
        perform public.import_approved_legacy_monthly_entitlement(v_subscription_id);

        select count(*) into v_imports
        from public.billing_legacy_monthly_import_approvals
        where consumed_at is not null;
        select count(*) into v_replays
        from public.billing_entitlements
        where stripe_subscription_id = v_subscription_id;

        if v_imports <> 1 or v_replays <> 1 then
            raise exception 'approval import/replay invariant failed: imports %, entitlements %', v_imports, v_replays;
        end if;
    end
    \$\$;
" >/dev/null

printf 'Legacy-monthly approval-set concurrency integration passed.\n'
