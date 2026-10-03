#!/usr/bin/env bash
set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${ENTITLEMENT_CONCURRENCY_TEST_PG_PORT:-55434}"
DATA_DIR="$(mktemp -d /tmp/lp-entitlement-concurrency.XXXXXX)"
DB_NAME="lp_entitlements_concurrency_test"
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
"${PSQL[@]}" -f supabase/migrations/027_entitlement_recovery.sql >/dev/null
"${PSQL[@]}" -c "
    insert into auth.users (id, email_confirmed_at) values
        ('00000000-0000-0000-0000-0000000000a1', null);
    create function public.entitlement_test_race_pause() returns trigger language plpgsql as \$\$
    begin
        perform pg_sleep(1);
        return new;
    end;
    \$\$;
    create trigger entitlement_test_race_pause
        before insert on public.billing_entitlements
        for each row execute function public.entitlement_test_race_pause();
" >/dev/null

"${PSQL[@]}" -c "
    select * from public.record_stripe_entitlement(
        'evt_concurrent_1', 'checkout.session.completed', now(), 'digest-1', 'cs_concurrent_1',
        '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_concurrent_1', null,
        'cus_concurrent_1', 'email-hmac-concurrent', 1
    );
" >"$FIRST_OUTPUT" 2>&1 &
first_pid=$!

"${PSQL[@]}" -c "
    select * from public.record_stripe_entitlement(
        'evt_concurrent_2', 'checkout.session.completed', now(), 'digest-2', 'cs_concurrent_1',
        '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_concurrent_1', null,
        'cus_concurrent_1', 'email-hmac-concurrent', 1
    );
" >"$SECOND_OUTPUT" 2>&1 &
second_pid=$!

set +e
wait "$first_pid"
first_status=$?
wait "$second_pid"
second_status=$?
set -e

if [[ "$first_status" -ne 0 || "$second_status" -ne 0 ]]; then
    printf 'Concurrent distinct checkout events must both succeed; got statuses %s and %s.\n' "$first_status" "$second_status" >&2
    exit 1
fi

"${PSQL[@]}" -c "
    do \$\$
    declare
        v_entitlements integer;
        v_events integer;
        v_grants integer;
        v_existing integer;
    begin
        select count(*) into v_entitlements from public.billing_entitlements
        where stripe_checkout_session_id = 'cs_concurrent_1';
        select count(*) into v_events from public.stripe_webhook_events
        where stripe_event_id in ('evt_concurrent_1', 'evt_concurrent_2');
        select count(*) into v_grants from public.stripe_webhook_events
        where stripe_event_id in ('evt_concurrent_1', 'evt_concurrent_2') and outcome = 'granted';
        select count(*) into v_existing from public.stripe_webhook_events
        where stripe_event_id in ('evt_concurrent_1', 'evt_concurrent_2') and outcome = 'existing_session';

        if v_entitlements <> 1 or v_events <> 2 or v_grants <> 1 or v_existing <> 1 then
            raise exception 'concurrency invariant failed: entitlements %, events %, grants %, existing %',
                v_entitlements, v_events, v_grants, v_existing;
        end if;
    end
    \$\$;
" >/dev/null

printf 'Entitlement concurrency integration passed.\n'
