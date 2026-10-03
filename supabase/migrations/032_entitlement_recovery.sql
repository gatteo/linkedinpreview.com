-- Immutable Stripe purchase identities and a derived billing projection.
-- This migration is additive. Existing billing rows are deliberately not imported.

create table public.billing_entitlements (
    id                              uuid primary key default gen_random_uuid(),
    stripe_checkout_session_id      text not null unique,
    stripe_payment_intent_id        text unique,
    stripe_subscription_id          text unique,
    stripe_customer_id              text,
    origin_user_id                  uuid not null references auth.users(id) on delete restrict,
    owner_user_id                   uuid not null references auth.users(id) on delete restrict,
    plan                            text not null check (plan in ('pro', 'lifetime')),
    status                          text not null default 'active' check (status in ('active', 'inactive', 'refunded', 'disputed')),
    checkout_email_hmac             text,
    checkout_email_hmac_key_version integer,
    stripe_created_at               timestamptz not null,
    subscription_lifecycle_observed_at timestamptz,
    owner_version                   integer not null default 1,
    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now(),
    check ((checkout_email_hmac is null) = (checkout_email_hmac_key_version is null))
);

create index idx_billing_entitlements_owner_active
    on public.billing_entitlements (owner_user_id, plan)
    where status = 'active';

create table public.billing_entitlement_assignments (
    id                 uuid primary key default gen_random_uuid(),
    entitlement_id     uuid not null references public.billing_entitlements(id) on delete restrict,
    from_user_id       uuid not null references auth.users(id) on delete restrict,
    to_user_id         uuid not null references auth.users(id) on delete restrict,
    reason             text not null check (reason in ('email_recovery', 'approved_historical_import')),
    challenge_id       uuid,
    actor              text not null default 'service_role',
    owner_version      integer not null,
    created_at         timestamptz not null default now(),
    check (from_user_id <> to_user_id),
    unique (entitlement_id, owner_version)
);

create table public.stripe_webhook_events (
    stripe_event_id    text primary key,
    event_type         text not null,
    stripe_created_at  timestamptz not null,
    payload_digest     text not null,
    outcome            text not null check (outcome in (
        'granted',
        'existing_session',
        'duplicate_event',
        'unresolved',
        'subscription_activated',
        'subscription_inactivated',
        'subscription_stale',
        'legacy_monthly_imported'
    )),
    entitlement_id     uuid references public.billing_entitlements(id) on delete restrict,
    created_at         timestamptz not null default now()
);

create or replace function public.prevent_stripe_webhook_event_change()
returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
    if tg_op = 'DELETE'
       or old.outcome <> 'unresolved'
       or new.stripe_event_id is distinct from old.stripe_event_id
       or new.event_type is distinct from old.event_type
       or new.stripe_created_at is distinct from old.stripe_created_at
       or new.payload_digest is distinct from old.payload_digest
       or new.created_at is distinct from old.created_at
       or (old.entitlement_id is not null and new.entitlement_id is distinct from old.entitlement_id)
       or new.outcome = 'unresolved'
       or new.entitlement_id is null then
        raise exception 'Immutable Stripe webhook event cannot be changed';
    end if;
    return new;
end;
$$;

create trigger prevent_stripe_webhook_event_change
before update or delete on public.stripe_webhook_events
for each row execute function public.prevent_stripe_webhook_event_change();

create table public.billing_recovery_challenges (
    id                         uuid primary key default gen_random_uuid(),
    email_hmac                 text not null,
    email_hmac_key_version     integer not null,
    target_user_id             uuid not null references auth.users(id) on delete restrict,
    verified_at                timestamptz,
    expires_at                 timestamptz not null,
    consumed_at                timestamptz,
    created_at                 timestamptz not null default now(),
    check (expires_at > created_at)
);

-- The bridge is bounded to two human-reviewed Stripe identities. Application code
-- cannot insert or amend approvals, and the bridge accepts no caller-supplied identity.
create table public.billing_legacy_monthly_import_approvals (
    approval_id                     text primary key,
    stripe_checkout_session_id      text not null unique,
    stripe_payment_intent_id        text unique,
    stripe_subscription_id          text not null unique,
    stripe_customer_id              text not null,
    origin_user_id                  uuid not null references auth.users(id) on delete restrict,
    checkout_email_hmac             text not null,
    checkout_email_hmac_key_version integer not null,
    stripe_created_at               timestamptz not null,
    reviewed_at                     timestamptz not null,
    expires_at                      timestamptz not null,
    approved_by                     text not null,
    consumed_at                     timestamptz,
    entitlement_id                  uuid unique references public.billing_entitlements(id) on delete restrict,
    created_at                      timestamptz not null default now(),
    check (approval_id = 'legacy_monthly:' || stripe_subscription_id),
    check (stripe_checkout_session_id <> ''),
    check (stripe_subscription_id <> ''),
    check (stripe_customer_id <> ''),
    check (checkout_email_hmac <> ''),
    check (expires_at > reviewed_at),
    check ((consumed_at is null and entitlement_id is null) or (consumed_at is not null and entitlement_id is not null))
);

create or replace function public.limit_legacy_monthly_approval_inserts()
returns trigger
language plpgsql set search_path = public as $$
begin
    perform pg_advisory_xact_lock(hashtextextended('billing_legacy_monthly_import_approvals:v1', 0));

    if (select count(*) from public.billing_legacy_monthly_import_approvals) >= 2 then
        raise exception 'Only two legacy monthly approvals are permitted';
    end if;
    return new;
end;
$$;

create trigger limit_legacy_monthly_approval_inserts
before insert on public.billing_legacy_monthly_import_approvals
for each row execute function public.limit_legacy_monthly_approval_inserts();

create or replace function public.prevent_legacy_monthly_approval_change()
returns trigger
language plpgsql set search_path = public as $$
begin
    if tg_op = 'DELETE'
       or new.approval_id is distinct from old.approval_id
       or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.origin_user_id is distinct from old.origin_user_id
       or new.checkout_email_hmac is distinct from old.checkout_email_hmac
       or new.checkout_email_hmac_key_version is distinct from old.checkout_email_hmac_key_version
       or new.stripe_created_at is distinct from old.stripe_created_at
       or new.reviewed_at is distinct from old.reviewed_at
       or new.expires_at is distinct from old.expires_at
       or new.approved_by is distinct from old.approved_by
       or new.created_at is distinct from old.created_at
       or old.consumed_at is not null
       or new.consumed_at is null
       or new.entitlement_id is null then
        raise exception 'Immutable legacy monthly approval cannot be changed';
    end if;
    return new;
end;
$$;

create trigger prevent_legacy_monthly_approval_change
before update or delete on public.billing_legacy_monthly_import_approvals
for each row execute function public.prevent_legacy_monthly_approval_change();

create or replace function public.prevent_recovery_challenge_change()
returns trigger
language plpgsql set search_path = public as $$
begin
    if tg_op = 'DELETE'
        or new.id is distinct from old.id
        or new.email_hmac is distinct from old.email_hmac
        or new.email_hmac_key_version is distinct from old.email_hmac_key_version
        or new.target_user_id is distinct from old.target_user_id
        or new.verified_at is distinct from old.verified_at
        or new.expires_at is distinct from old.expires_at
        or new.created_at is distinct from old.created_at
        or old.consumed_at is not null
        or new.consumed_at is null then
        raise exception 'Immutable recovery challenge cannot be changed';
    end if;

    return new;
end;
$$;

create trigger prevent_recovery_challenge_change
before update or delete on public.billing_recovery_challenges
for each row execute function public.prevent_recovery_challenge_change();

create or replace function public.require_fresh_matching_recovery_challenge()
returns trigger
language plpgsql set search_path = public as $$
declare
    v_entitlement_email_hmac text;
    v_entitlement_key_version integer;
    v_target_confirmed_at timestamptz;
begin
    if new.reason <> 'email_recovery' then
        return new;
    end if;

    select e.checkout_email_hmac, e.checkout_email_hmac_key_version
    into v_entitlement_email_hmac, v_entitlement_key_version
    from public.billing_entitlements e
    where e.id = new.entitlement_id;

    if new.challenge_id is null
       or not exists (
           select 1
           from public.billing_recovery_challenges c
           where c.id = new.challenge_id
             and c.verified_at is not null
             and c.consumed_at is null
             and c.expires_at > clock_timestamp()
             and c.email_hmac = v_entitlement_email_hmac
             and c.email_hmac_key_version = v_entitlement_key_version
             and c.target_user_id = new.to_user_id
       ) then
        raise exception 'Fresh matching proof required';
    end if;

    select u.email_confirmed_at
    into v_target_confirmed_at
    from auth.users u
    where u.id = new.to_user_id;

    if v_target_confirmed_at is null then
        raise exception 'Target account email must be confirmed';
    end if;

    return new;
end;
$$;

create trigger require_fresh_matching_recovery_challenge
before insert on public.billing_entitlement_assignments
for each row execute function public.require_fresh_matching_recovery_challenge();

create or replace function public.prevent_entitlement_assignment_change()
returns trigger
language plpgsql set search_path = public as $$
begin
    raise exception 'Immutable entitlement assignment cannot be changed';
end;
$$;

create trigger prevent_entitlement_assignment_change
before update or delete on public.billing_entitlement_assignments
for each row execute function public.prevent_entitlement_assignment_change();

create or replace function public.prevent_entitlement_identity_change()
returns trigger
language plpgsql set search_path = public as $$
begin
    if new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.origin_user_id is distinct from old.origin_user_id
       or new.plan is distinct from old.plan
       or new.checkout_email_hmac is distinct from old.checkout_email_hmac
       or new.checkout_email_hmac_key_version is distinct from old.checkout_email_hmac_key_version
       or new.stripe_created_at is distinct from old.stripe_created_at then
        raise exception 'Immutable entitlement identity cannot be changed';
    end if;

    if new.owner_user_id is distinct from old.owner_user_id
        or new.owner_version is distinct from old.owner_version then
        if new.owner_version <> old.owner_version + 1
            or not exists (
                select 1
                from public.billing_entitlement_assignments a
                where a.entitlement_id = old.id
                    and a.from_user_id = old.owner_user_id
                    and a.to_user_id = new.owner_user_id
                    and a.owner_version = new.owner_version
                    and a.reason = 'email_recovery'
                    and a.challenge_id is not null
            ) then
            raise exception 'Immutable entitlement identity cannot be changed';
        end if;

        if not exists (
            select 1
            from public.billing_entitlement_assignments a
            join public.billing_recovery_challenges c on c.id = a.challenge_id
            where a.entitlement_id = old.id
                and a.from_user_id = old.owner_user_id
                and a.to_user_id = new.owner_user_id
                and a.owner_version = new.owner_version
                and a.reason = 'email_recovery'
                and c.verified_at is not null
                and c.consumed_at is null
                and c.expires_at > clock_timestamp()
                and c.email_hmac = old.checkout_email_hmac
                and c.email_hmac_key_version = old.checkout_email_hmac_key_version
                and c.target_user_id = new.owner_user_id
        ) then
            raise exception 'Fresh matching proof required';
        end if;
    end if;
    return new;
end;
$$;

create trigger prevent_entitlement_identity_change
before update on public.billing_entitlements
for each row execute function public.prevent_entitlement_identity_change();

alter table public.billing_entitlements enable row level security;
alter table public.billing_entitlement_assignments enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.billing_recovery_challenges enable row level security;
alter table public.billing_legacy_monthly_import_approvals enable row level security;

create or replace function public.recompute_billing_projection(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
    v_plan text;
    v_existing_plan text;
    v_source text;
    v_existing_renews_at timestamptz;
    v_customer_id text;
    v_subscription_id text;
begin
    select e.plan, e.stripe_customer_id, e.stripe_subscription_id
    into v_plan, v_customer_id, v_subscription_id
    from public.billing_entitlements e
    where e.owner_user_id = p_user_id and e.status = 'active'
    order by case e.plan when 'lifetime' then 0 else 1 end, e.created_at asc
    limit 1;

    select b.plan, b.plan_source, b.plan_renews_at
    into v_existing_plan, v_source, v_existing_renews_at
    from public.billing b
    where b.user_id = p_user_id;

    -- A pre-ledger lifetime entitlement remains the stronger plan until a reviewed
    -- import creates its immutable ledger record. A later monthly purchase must not
    -- downgrade it through this derived projection.
    if v_plan = 'pro' and v_existing_plan = 'lifetime' and coalesce(v_source, '') not like 'stripe_entitlement_%' then
        return;
    end if;

    -- The new sources are intentionally distinct from legacy billing rows. This
    -- means a transfer cannot revoke a paid legacy row that has not been reviewed
    -- into the immutable ledger yet.
    if v_plan is null and coalesce(v_source, '') not like 'stripe_entitlement_%' then
        return;
    end if;

    insert into public.billing (
        user_id, plan, plan_source, plan_renews_at, stripe_customer_id, stripe_subscription_id, updated_at
    ) values (
        p_user_id,
        coalesce(v_plan, 'free'),
        case v_plan when 'lifetime' then 'stripe_entitlement_lifetime' when 'pro' then 'stripe_entitlement_monthly' else null end,
        null,
        v_customer_id,
        v_subscription_id,
        now()
    ) on conflict (user_id) do update set
        plan = excluded.plan,
        plan_source = excluded.plan_source,
        plan_renews_at = excluded.plan_renews_at,
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_subscription_id = excluded.stripe_subscription_id,
        updated_at = excluded.updated_at;
end; $$;

create or replace function public.record_stripe_entitlement(
    p_event_id text,
    p_event_type text,
    p_stripe_created_at timestamptz,
    p_payload_digest text,
    p_checkout_session_id text,
    p_origin_user_id uuid,
    p_plan text,
    p_status text,
    p_payment_intent_id text default null,
    p_subscription_id text default null,
    p_customer_id text default null,
    p_checkout_email_hmac text default null,
    p_checkout_email_hmac_key_version integer default null,
    p_event_created_at timestamptz default null
)
returns table (outcome text, owner_user_id uuid, plan text, capture_conversion boolean)
language plpgsql security definer set search_path = public as $$
declare
    v_entitlement_id uuid;
    v_owner_user_id uuid;
    v_created boolean := false;
    v_event_inserted boolean := false;
begin
    if p_plan not in ('pro', 'lifetime') or p_status <> 'active' then
        raise exception 'Invalid entitlement grant';
    end if;

    -- `FOR UPDATE` cannot lock an entitlement row that does not exist yet. Serialize all
    -- first deliveries for the same immutable Checkout Session before its unique insert.
    perform pg_advisory_xact_lock(hashtextextended(p_checkout_session_id, 0));

    insert into public.stripe_webhook_events (
        stripe_event_id, event_type, stripe_created_at, payload_digest, outcome
    ) values (
        p_event_id, p_event_type, coalesce(p_event_created_at, p_stripe_created_at), p_payload_digest, 'unresolved'
    ) on conflict (stripe_event_id) do nothing
    returning true into v_event_inserted;

    if not coalesce(v_event_inserted, false) then
        return query select 'duplicate_event'::text, null::uuid, null::text, false;
        return;
    end if;

    select e.id, e.owner_user_id into v_entitlement_id, v_owner_user_id
    from public.billing_entitlements e
    where e.stripe_checkout_session_id = p_checkout_session_id
    for update;

    if v_entitlement_id is null then
        insert into public.billing_entitlements as entitlement (
            stripe_checkout_session_id, stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id,
            origin_user_id, owner_user_id, plan, status, checkout_email_hmac, checkout_email_hmac_key_version,
            stripe_created_at
        ) values (
            p_checkout_session_id, p_payment_intent_id, p_subscription_id, p_customer_id,
            p_origin_user_id, p_origin_user_id, p_plan, p_status, p_checkout_email_hmac,
            p_checkout_email_hmac_key_version, p_stripe_created_at
        ) returning entitlement.id, entitlement.owner_user_id into v_entitlement_id, v_owner_user_id;
        v_created := true;
        perform public.recompute_billing_projection(p_origin_user_id);
    elsif not exists (
        select 1
        from public.billing_entitlements e
        where e.id = v_entitlement_id
          and e.stripe_checkout_session_id is not distinct from p_checkout_session_id
          and e.stripe_payment_intent_id is not distinct from p_payment_intent_id
          and e.stripe_subscription_id is not distinct from p_subscription_id
          and e.stripe_customer_id is not distinct from p_customer_id
          and e.origin_user_id is not distinct from p_origin_user_id
          and e.plan is not distinct from p_plan
          and e.checkout_email_hmac is not distinct from p_checkout_email_hmac
          and e.checkout_email_hmac_key_version is not distinct from p_checkout_email_hmac_key_version
          and e.stripe_created_at is not distinct from p_stripe_created_at
    ) then
        raise exception 'Checkout entitlement identity conflict';
    end if;

    update public.stripe_webhook_events
    set entitlement_id = v_entitlement_id,
        outcome = case when v_created then 'granted' else 'existing_session' end
    where stripe_event_id = p_event_id;

    return query select
        case when v_created then 'granted' else 'existing_session' end,
        v_owner_user_id,
        p_plan,
        v_created;
end; $$;

-- The historical bridge accepts only an approved subscription ID. All immutable
-- identity fields come from a two-record human-reviewed approval ledger, never the
-- mutable billing projection or a caller-provided payload.
create or replace function public.import_approved_legacy_monthly_entitlement(
    p_subscription_id text
)
returns table (outcome text, owner_user_id uuid, plan text, capture_conversion boolean)
language plpgsql security definer set search_path = public as $$
declare
    v_approval public.billing_legacy_monthly_import_approvals%rowtype;
    v_entitlement_id uuid;
    v_owner_user_id uuid;
    v_candidate_count integer;
begin
    if p_subscription_id is null or p_subscription_id = '' then
        raise exception 'Legacy monthly approval not found';
    end if;

    perform pg_advisory_xact_lock(hashtextextended('billing_legacy_monthly_import_approvals:v1', 0));

    if (select count(*) from public.billing_legacy_monthly_import_approvals) <> 2 then
        raise exception 'Exactly two legacy monthly approvals are required';
    end if;

    select * into v_approval
    from public.billing_legacy_monthly_import_approvals
    where stripe_subscription_id = p_subscription_id
    for update;

    if not found then
        raise exception 'Legacy monthly approval not found';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(v_approval.stripe_checkout_session_id, 0));

    if v_approval.consumed_at is not null then
        select e.owner_user_id into v_owner_user_id
        from public.billing_entitlements e
        where e.id = v_approval.entitlement_id;
        return query select 'legacy_monthly_replayed'::text, v_owner_user_id, 'pro'::text, false;
        return;
    end if;

    if v_approval.expires_at <= clock_timestamp() then
        raise exception 'Legacy monthly approval expired';
    end if;

    perform 1
    from public.billing_entitlements e
    where e.stripe_checkout_session_id = v_approval.stripe_checkout_session_id
       or e.stripe_subscription_id = v_approval.stripe_subscription_id
       or (v_approval.stripe_payment_intent_id is not null
           and e.stripe_payment_intent_id = v_approval.stripe_payment_intent_id)
    for update;

    select count(*) into v_candidate_count
    from public.billing_entitlements e
    where e.stripe_checkout_session_id = v_approval.stripe_checkout_session_id
       or e.stripe_subscription_id = v_approval.stripe_subscription_id
       or (v_approval.stripe_payment_intent_id is not null
           and e.stripe_payment_intent_id = v_approval.stripe_payment_intent_id);

    if v_candidate_count = 1 then
        select e.id into v_entitlement_id
        from public.billing_entitlements e
        where e.stripe_checkout_session_id = v_approval.stripe_checkout_session_id
           or e.stripe_subscription_id = v_approval.stripe_subscription_id
           or (v_approval.stripe_payment_intent_id is not null
               and e.stripe_payment_intent_id = v_approval.stripe_payment_intent_id);
    end if;

    if v_candidate_count > 1 then
        raise exception 'Legacy monthly entitlement identity conflict';
    end if;

    if v_entitlement_id is null then
        insert into public.billing_entitlements as entitlement (
            stripe_checkout_session_id, stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id,
            origin_user_id, owner_user_id, plan, status, checkout_email_hmac,
            checkout_email_hmac_key_version, stripe_created_at, subscription_lifecycle_observed_at
        ) values (
            v_approval.stripe_checkout_session_id, v_approval.stripe_payment_intent_id,
            v_approval.stripe_subscription_id, v_approval.stripe_customer_id,
            v_approval.origin_user_id, v_approval.origin_user_id, 'pro', 'active',
            v_approval.checkout_email_hmac, v_approval.checkout_email_hmac_key_version,
            v_approval.stripe_created_at, v_approval.reviewed_at
        ) returning entitlement.id, entitlement.owner_user_id into v_entitlement_id, v_owner_user_id;
    else
        if not exists (
            select 1 from public.billing_entitlements e
            where e.id = v_entitlement_id
              and e.stripe_checkout_session_id is not distinct from v_approval.stripe_checkout_session_id
              and e.stripe_payment_intent_id is not distinct from v_approval.stripe_payment_intent_id
              and e.stripe_subscription_id is not distinct from v_approval.stripe_subscription_id
              and e.stripe_customer_id is not distinct from v_approval.stripe_customer_id
              and e.origin_user_id is not distinct from v_approval.origin_user_id
              and e.plan = 'pro'
              and e.checkout_email_hmac is not distinct from v_approval.checkout_email_hmac
              and e.checkout_email_hmac_key_version is not distinct from v_approval.checkout_email_hmac_key_version
              and e.stripe_created_at is not distinct from v_approval.stripe_created_at
              and e.status = 'active'
        ) then
            raise exception 'Legacy monthly entitlement identity conflict';
        end if;
        select owner_user_id into v_owner_user_id from public.billing_entitlements where id = v_entitlement_id;
    end if;

    update public.billing_legacy_monthly_import_approvals
    set consumed_at = clock_timestamp(), entitlement_id = v_entitlement_id
    where approval_id = v_approval.approval_id;

    perform public.recompute_billing_projection(v_owner_user_id);
    return query select 'legacy_monthly_imported'::text, v_owner_user_id, 'pro'::text, false;
end; $$;

-- Lifecycle events are state observations of an existing immutable entitlement.
-- They accept no owner, customer, checkout metadata, or plan input, so only the
-- recovery RPC can change ownership. Event time rejects late active deliveries;
-- ties resolve toward inactive to avoid resurrecting access on unordered delivery.
create or replace function public.record_stripe_subscription_lifecycle(
    p_event_id text,
    p_event_type text,
    p_stripe_created_at timestamptz,
    p_payload_digest text,
    p_subscription_id text,
    p_status text
)
returns table (outcome text, owner_user_id uuid, plan text, projection_changed boolean)
language plpgsql security definer set search_path = public as $$
declare
    v_entitlement_id uuid;
    v_owner_user_id uuid;
    v_plan text;
    v_current_status text;
    v_observed_at timestamptz;
    v_event_inserted boolean := false;
    v_apply boolean := false;
    v_outcome text;
begin
    if p_event_type not in ('customer.subscription.updated', 'customer.subscription.deleted')
       or p_status not in ('active', 'inactive') then
        raise exception 'Invalid subscription lifecycle observation';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(p_subscription_id, 0));

    select e.id, e.owner_user_id, e.plan, e.status, e.subscription_lifecycle_observed_at
    into v_entitlement_id, v_owner_user_id, v_plan, v_current_status, v_observed_at
    from public.billing_entitlements e
    where e.stripe_subscription_id = p_subscription_id
    for update;

    -- No event row is written until the immutable purchase exists. A reordered
    -- lifecycle delivery returns 500 and Stripe can retry after checkout completion.
    if v_entitlement_id is null then
        raise exception 'Immutable subscription entitlement not found';
    end if;

    insert into public.stripe_webhook_events (
        stripe_event_id, event_type, stripe_created_at, payload_digest, outcome, entitlement_id
    ) values (
        p_event_id, p_event_type, p_stripe_created_at, p_payload_digest, 'unresolved', v_entitlement_id
    ) on conflict (stripe_event_id) do nothing
    returning true into v_event_inserted;

    if not coalesce(v_event_inserted, false) then
        return query select 'duplicate_event'::text, null::uuid, null::text, false;
        return;
    end if;

    v_apply := v_observed_at is null
        or p_stripe_created_at > v_observed_at
        or (p_stripe_created_at = v_observed_at and p_status = 'inactive' and v_current_status <> 'inactive');

    if v_apply then
        update public.billing_entitlements
        set status = p_status,
            subscription_lifecycle_observed_at = p_stripe_created_at,
            updated_at = now()
        where id = v_entitlement_id;

        perform public.recompute_billing_projection(v_owner_user_id);
        v_outcome := case when p_status = 'active' then 'subscription_activated' else 'subscription_inactivated' end;
    else
        v_outcome := 'subscription_stale';
    end if;

    update public.stripe_webhook_events
    set outcome = v_outcome
    where stripe_event_id = p_event_id;

    return query select v_outcome, v_owner_user_id, v_plan, v_apply;
end; $$;

create or replace function public.claim_entitlement(
    p_entitlement_id uuid,
    p_to_user_id uuid,
    p_challenge_id uuid
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
    v_from_user_id uuid;
    v_owner_version integer;
    v_entitlement_email_hmac text;
    v_entitlement_key_version integer;
    v_challenge_email_hmac text;
    v_challenge_key_version integer;
    v_challenge_target_user_id uuid;
    v_owner_confirmed_at timestamptz;
    v_target_confirmed_at timestamptz;
begin
    select e.owner_user_id, e.owner_version, e.checkout_email_hmac, e.checkout_email_hmac_key_version
    into v_from_user_id, v_owner_version, v_entitlement_email_hmac, v_entitlement_key_version
    from public.billing_entitlements e
    where e.id = p_entitlement_id and e.status = 'active'
    for update;

    if v_from_user_id is null then
        raise exception 'Eligible entitlement not found';
    end if;

    select c.email_hmac, c.email_hmac_key_version, c.target_user_id
    into v_challenge_email_hmac, v_challenge_key_version, v_challenge_target_user_id
    from public.billing_recovery_challenges c
    where c.id = p_challenge_id
      and c.verified_at is not null
      and c.consumed_at is null
      and c.expires_at > clock_timestamp()
    for update;

    if v_challenge_email_hmac is null
       or v_challenge_email_hmac <> v_entitlement_email_hmac
       or v_challenge_key_version <> v_entitlement_key_version then
        raise exception 'Fresh matching proof required';
    end if;
    if v_challenge_target_user_id <> p_to_user_id then
        raise exception 'Recovery proof target account mismatch';
    end if;

    select email_confirmed_at into v_owner_confirmed_at from auth.users where id = v_from_user_id;
    select email_confirmed_at into v_target_confirmed_at from auth.users where id = p_to_user_id;

    if v_target_confirmed_at is null then
        raise exception 'Target account email must be confirmed';
    end if;
    if v_owner_confirmed_at is not null then
        raise exception 'Manual review required for a confirmed owner';
    end if;

    insert into public.billing_entitlement_assignments (
        entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
    ) values (
        p_entitlement_id, v_from_user_id, p_to_user_id, 'email_recovery', p_challenge_id, v_owner_version + 1
    );

    update public.billing_entitlements
    set owner_user_id = p_to_user_id,
        owner_version = v_owner_version + 1,
        updated_at = now()
    where id = p_entitlement_id;

    update public.billing_recovery_challenges set consumed_at = now() where id = p_challenge_id;
    perform public.recompute_billing_projection(v_from_user_id);
    perform public.recompute_billing_projection(p_to_user_id);
    return true;
end; $$;

revoke all on public.billing_entitlements, public.billing_entitlement_assignments,
    public.stripe_webhook_events, public.billing_recovery_challenges,
    public.billing_legacy_monthly_import_approvals from public, anon, authenticated, service_role;
revoke all on function public.recompute_billing_projection(uuid) from public, anon, authenticated;
revoke all on function public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer, timestamptz)
    from public, anon, authenticated;
revoke all on function public.record_stripe_subscription_lifecycle(text, text, timestamptz, text, text, text)
    from public, anon, authenticated;
revoke all on function public.import_approved_legacy_monthly_entitlement(text)
    from public, anon, authenticated;
revoke all on function public.claim_entitlement(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.recompute_billing_projection(uuid) to service_role;
grant execute on function public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer, timestamptz)
    to service_role;
grant execute on function public.record_stripe_subscription_lifecycle(text, text, timestamptz, text, text, text)
    to service_role;
grant execute on function public.import_approved_legacy_monthly_entitlement(text)
    to service_role;
grant execute on function public.claim_entitlement(uuid, uuid, uuid) to service_role;
