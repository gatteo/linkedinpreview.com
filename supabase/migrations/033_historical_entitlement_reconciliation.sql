-- Generic, human-reviewed historical paid-entitlement reconciliation.
-- Additive only. This remains unapplied until a reviewed production manifest exists.

create table public.billing_entitlement_reconciliation_runs (
    id                                  uuid primary key default gen_random_uuid(),
    cutoff_at                           timestamptz not null,
    manifest_digest                     text not null unique,
    expected_paid_account_count         integer not null check (expected_paid_account_count >= 0),
    expected_paid_checkout_session_count integer not null check (expected_paid_checkout_session_count >= 0),
    approved_by                         text not null,
    approved_at                         timestamptz not null,
    sealed_at                           timestamptz,
    sealed_approval_set_digest          text,
    created_at                          timestamptz not null default now(),
    check (manifest_digest <> ''),
    check ((sealed_at is null) = (sealed_approval_set_digest is null)),
    check (sealed_approval_set_digest is null or sealed_approval_set_digest <> '')
);

create table public.billing_entitlement_reconciliation_approvals (
    id                              uuid primary key default gen_random_uuid(),
    reconciliation_run_id           uuid not null references public.billing_entitlement_reconciliation_runs(id) on delete restrict,
    disposition                     text not null check (disposition in ('approved_import', 'already_ledgered', 'not_entitled', 'manual_exception')),
    plan                            text not null check (plan in ('pro', 'lifetime')),
    stripe_checkout_session_id      text unique,
    stripe_payment_intent_id        text unique,
    stripe_subscription_id          text unique,
    stripe_customer_id              text,
    origin_user_id                  uuid not null references auth.users(id) on delete restrict,
    checkout_email_hmac             text,
    checkout_email_hmac_key_version integer,
    stripe_created_at               timestamptz,
    canonical_status                text not null check (canonical_status in ('active', 'inactive', 'refunded', 'disputed')),
    status_observed_at              timestamptz not null,
    evidence_digest                 text not null,
    reviewed_by                     text not null,
    reviewed_at                     timestamptz not null,
    expires_at                      timestamptz,
    exception_reason                text,
    consumed_at                     timestamptz,
    entitlement_id                  uuid unique references public.billing_entitlements(id) on delete restrict,
    created_at                      timestamptz not null default now(),
    unique (reconciliation_run_id, origin_user_id),
    check ((checkout_email_hmac is null) = (checkout_email_hmac_key_version is null)),
    check (
        (disposition = 'approved_import'
            and stripe_checkout_session_id is not null
            and stripe_customer_id is not null
            and stripe_created_at is not null
            and canonical_status = 'active'
            and expires_at is not null
            and exception_reason is null)
        or (disposition <> 'approved_import')
    ),
    check (
        (disposition = 'manual_exception'
            and stripe_checkout_session_id is null
            and stripe_payment_intent_id is null
            and stripe_subscription_id is null
            and stripe_customer_id is null
            and checkout_email_hmac is null
            and checkout_email_hmac_key_version is null
            and stripe_created_at is null
            and expires_at is null
            and exception_reason is not null)
        or disposition <> 'manual_exception'
    ),
    check ((consumed_at is null and entitlement_id is null) or (consumed_at is not null and entitlement_id is not null)),
    check (evidence_digest <> '')
);

create index idx_billing_entitlement_reconciliation_approvals_import
    on public.billing_entitlement_reconciliation_approvals (reconciliation_run_id, stripe_checkout_session_id)
    where disposition = 'approved_import' and consumed_at is null;

create or replace function public.historical_entitlement_approval_set_digest(
    p_reconciliation_run_id uuid
)
returns text
language sql
stable
set search_path = pg_catalog, public
as $$
    select md5(coalesce(string_agg(
        concat_ws('|',
            a.id::text, a.disposition, a.plan, a.stripe_checkout_session_id,
            a.stripe_payment_intent_id, a.stripe_subscription_id, a.stripe_customer_id,
            a.origin_user_id::text, a.checkout_email_hmac,
            a.checkout_email_hmac_key_version::text, a.stripe_created_at::text,
            a.canonical_status, a.status_observed_at::text, a.evidence_digest,
            a.reviewed_by, a.reviewed_at::text, a.expires_at::text, a.exception_reason
        ),
        E'\n' order by a.id::text
    ), ''))
    from public.billing_entitlement_reconciliation_approvals a
    where a.reconciliation_run_id = p_reconciliation_run_id;
$$;

create or replace function public.prevent_reconciliation_run_change()
returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
    if tg_op = 'DELETE'
       or new.id is distinct from old.id
       or new.cutoff_at is distinct from old.cutoff_at
       or new.manifest_digest is distinct from old.manifest_digest
       or new.expected_paid_account_count is distinct from old.expected_paid_account_count
       or new.expected_paid_checkout_session_count is distinct from old.expected_paid_checkout_session_count
       or new.approved_by is distinct from old.approved_by
       or new.approved_at is distinct from old.approved_at
       or new.created_at is distinct from old.created_at
       or old.sealed_at is not null
       or new.sealed_at is null
       or new.sealed_approval_set_digest is null then
        raise exception 'Immutable reconciliation run cannot be changed';
    end if;
    return new;
end;
$$;

create trigger prevent_reconciliation_run_change
before update or delete on public.billing_entitlement_reconciliation_runs
for each row execute function public.prevent_reconciliation_run_change();

create or replace function public.prevent_reconciliation_approval_change()
returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
    if tg_op = 'DELETE'
       or new.id is distinct from old.id
       or new.reconciliation_run_id is distinct from old.reconciliation_run_id
       or new.disposition is distinct from old.disposition
       or new.plan is distinct from old.plan
       or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.origin_user_id is distinct from old.origin_user_id
       or new.checkout_email_hmac is distinct from old.checkout_email_hmac
       or new.checkout_email_hmac_key_version is distinct from old.checkout_email_hmac_key_version
       or new.stripe_created_at is distinct from old.stripe_created_at
       or new.canonical_status is distinct from old.canonical_status
       or new.status_observed_at is distinct from old.status_observed_at
       or new.evidence_digest is distinct from old.evidence_digest
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.expires_at is distinct from old.expires_at
       or new.exception_reason is distinct from old.exception_reason
       or new.created_at is distinct from old.created_at
       or old.consumed_at is not null
       or new.consumed_at is null
       or new.entitlement_id is null then
        raise exception 'Immutable reconciliation approval cannot be changed';
    end if;
    return new;
end;
$$;

create trigger prevent_reconciliation_approval_change
before update or delete on public.billing_entitlement_reconciliation_approvals
for each row execute function public.prevent_reconciliation_approval_change();

create or replace function public.prevent_reconciliation_approval_insert_after_seal()
returns trigger
language plpgsql set search_path = pg_catalog, public as $$
declare
    v_sealed_at timestamptz;
begin
    select r.sealed_at into v_sealed_at
    from public.billing_entitlement_reconciliation_runs r
    where r.id = new.reconciliation_run_id
    for update;

    if v_sealed_at is not null then
        raise exception 'Historical reconciliation approval evidence is sealed';
    end if;
    return new;
end;
$$;

create trigger prevent_reconciliation_approval_insert_after_seal
before insert on public.billing_entitlement_reconciliation_approvals
for each row execute function public.prevent_reconciliation_approval_insert_after_seal();

create or replace function public.seal_historical_entitlement_reconciliation(
    p_reconciliation_run_id uuid
)
returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
    v_expected_paid_account_count integer;
    v_expected_paid_checkout_session_count integer;
    v_manifest_account_count integer;
    v_manifest_checkout_session_count integer;
begin
    select expected_paid_account_count, expected_paid_checkout_session_count
    into v_expected_paid_account_count, v_expected_paid_checkout_session_count
    from public.billing_entitlement_reconciliation_runs
    where id = p_reconciliation_run_id
    for update;

    if not found then
        raise exception 'Historical reconciliation approval not found';
    end if;

    select count(distinct origin_user_id),
           count(*) filter (where stripe_checkout_session_id is not null)
    into v_manifest_account_count, v_manifest_checkout_session_count
    from public.billing_entitlement_reconciliation_approvals
    where reconciliation_run_id = p_reconciliation_run_id;

    if v_manifest_account_count <> v_expected_paid_account_count
       or v_manifest_checkout_session_count <> v_expected_paid_checkout_session_count then
        raise exception 'Historical reconciliation manifest incomplete';
    end if;

    update public.billing_entitlement_reconciliation_runs
    set sealed_at = clock_timestamp(),
        sealed_approval_set_digest = public.historical_entitlement_approval_set_digest(p_reconciliation_run_id)
    where id = p_reconciliation_run_id;
end;
$$;

create or replace function public.import_approved_historical_entitlement(
    p_reconciliation_run_id uuid,
    p_checkout_session_id text
)
returns table (outcome text, owner_user_id uuid, plan text, capture_conversion boolean)
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
    v_approval public.billing_entitlement_reconciliation_approvals%rowtype;
    v_entitlement_id uuid;
    v_owner_user_id uuid;
    v_candidate_count integer;
    v_expected_paid_account_count integer;
    v_expected_paid_checkout_session_count integer;
    v_manifest_account_count integer;
    v_manifest_checkout_session_count integer;
    v_sealed_at timestamptz;
    v_sealed_approval_set_digest text;
begin
    if p_reconciliation_run_id is null or p_checkout_session_id is null or p_checkout_session_id = '' then
        raise exception 'Historical reconciliation approval not found';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended('billing_entitlement_reconciliation_runs:' || p_reconciliation_run_id::text, 0)
    );

    select expected_paid_account_count, expected_paid_checkout_session_count,
           sealed_at, sealed_approval_set_digest
    into v_expected_paid_account_count, v_expected_paid_checkout_session_count,
         v_sealed_at, v_sealed_approval_set_digest
    from public.billing_entitlement_reconciliation_runs
    where id = p_reconciliation_run_id
    for update;

    if not found then
        raise exception 'Historical reconciliation approval not found';
    end if;

    if v_sealed_at is null
       or v_sealed_approval_set_digest is distinct from public.historical_entitlement_approval_set_digest(p_reconciliation_run_id) then
        raise exception 'Historical reconciliation approval evidence is unsealed';
    end if;

    select count(distinct origin_user_id),
           count(*) filter (where stripe_checkout_session_id is not null)
    into v_manifest_account_count, v_manifest_checkout_session_count
    from public.billing_entitlement_reconciliation_approvals
    where reconciliation_run_id = p_reconciliation_run_id;

    if v_manifest_account_count <> v_expected_paid_account_count
       or v_manifest_checkout_session_count <> v_expected_paid_checkout_session_count then
        raise exception 'Historical reconciliation manifest incomplete';
    end if;

    select * into v_approval
    from public.billing_entitlement_reconciliation_approvals
    where reconciliation_run_id = p_reconciliation_run_id
      and stripe_checkout_session_id = p_checkout_session_id
    for update;

    if not found or v_approval.disposition <> 'approved_import' then
        raise exception 'Historical reconciliation approval not found';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(v_approval.stripe_checkout_session_id, 0));

    if v_approval.consumed_at is not null then
        select e.owner_user_id into v_owner_user_id
        from public.billing_entitlements e
        where e.id = v_approval.entitlement_id;
        return query select 'historical_import_replayed'::text, v_owner_user_id, v_approval.plan, false;
        return;
    end if;

    if v_approval.expires_at <= clock_timestamp() then
        raise exception 'Historical reconciliation approval expired';
    end if;

    select count(*) into v_candidate_count
    from public.billing_entitlements e
    where e.stripe_checkout_session_id = v_approval.stripe_checkout_session_id
       or (v_approval.stripe_payment_intent_id is not null and e.stripe_payment_intent_id = v_approval.stripe_payment_intent_id)
       or (v_approval.stripe_subscription_id is not null and e.stripe_subscription_id = v_approval.stripe_subscription_id);

    if v_candidate_count > 1 then
        raise exception 'Historical reconciliation identity conflict';
    end if;

    if v_candidate_count = 1 then
        select e.id, e.owner_user_id into v_entitlement_id, v_owner_user_id
        from public.billing_entitlements e
        where e.stripe_checkout_session_id = v_approval.stripe_checkout_session_id
           or (v_approval.stripe_payment_intent_id is not null and e.stripe_payment_intent_id = v_approval.stripe_payment_intent_id)
           or (v_approval.stripe_subscription_id is not null and e.stripe_subscription_id = v_approval.stripe_subscription_id);

        if exists (
            select 1
            from public.billing_entitlements e
            where e.id = v_entitlement_id
              and e.status <> 'active'
        ) then
            raise exception 'Historical reconciliation lifecycle conflict';
        end if;

        if not exists (
            select 1 from public.billing_entitlements e
            where e.id = v_entitlement_id
              and e.stripe_checkout_session_id is not distinct from v_approval.stripe_checkout_session_id
              and e.stripe_payment_intent_id is not distinct from v_approval.stripe_payment_intent_id
              and e.stripe_subscription_id is not distinct from v_approval.stripe_subscription_id
              and e.stripe_customer_id is not distinct from v_approval.stripe_customer_id
              and e.origin_user_id is not distinct from v_approval.origin_user_id
              and e.plan is not distinct from v_approval.plan
              and e.checkout_email_hmac is not distinct from v_approval.checkout_email_hmac
              and e.checkout_email_hmac_key_version is not distinct from v_approval.checkout_email_hmac_key_version
              and e.stripe_created_at is not distinct from v_approval.stripe_created_at
        ) then
            raise exception 'Historical reconciliation identity conflict';
        end if;
    else
        insert into public.billing_entitlements as entitlement (
            stripe_checkout_session_id, stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id,
            origin_user_id, owner_user_id, plan, status, checkout_email_hmac,
            checkout_email_hmac_key_version, stripe_created_at, subscription_lifecycle_observed_at
        ) values (
            v_approval.stripe_checkout_session_id, v_approval.stripe_payment_intent_id,
            v_approval.stripe_subscription_id, v_approval.stripe_customer_id,
            v_approval.origin_user_id, v_approval.origin_user_id, v_approval.plan, 'active',
            v_approval.checkout_email_hmac, v_approval.checkout_email_hmac_key_version,
            v_approval.stripe_created_at,
            case when v_approval.plan = 'pro' then v_approval.status_observed_at else null end
        ) returning entitlement.id, entitlement.owner_user_id into v_entitlement_id, v_owner_user_id;
    end if;

    update public.billing_entitlement_reconciliation_approvals
    set consumed_at = clock_timestamp(), entitlement_id = v_entitlement_id
    where id = v_approval.id;

    return query select 'historical_imported'::text, v_owner_user_id, v_approval.plan, false;
end;
$$;

alter table public.billing_entitlement_reconciliation_runs enable row level security;
alter table public.billing_entitlement_reconciliation_approvals enable row level security;

revoke all on public.billing_entitlement_reconciliation_runs from public, anon, authenticated, service_role;
revoke all on public.billing_entitlement_reconciliation_approvals from public, anon, authenticated, service_role;
revoke all on function public.import_approved_historical_entitlement(uuid, text) from public, anon, authenticated;
revoke all on function public.seal_historical_entitlement_reconciliation(uuid) from public, anon, authenticated;
grant execute on function public.import_approved_historical_entitlement(uuid, text) to service_role;
grant execute on function public.seal_historical_entitlement_reconciliation(uuid) to service_role;
