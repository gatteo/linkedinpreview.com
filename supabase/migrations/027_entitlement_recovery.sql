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
    outcome            text not null check (outcome in ('granted', 'existing_session', 'duplicate_event', 'unresolved')),
    entitlement_id     uuid references public.billing_entitlements(id) on delete restrict,
    created_at         timestamptz not null default now()
);

create table public.billing_recovery_challenges (
    id                         uuid primary key default gen_random_uuid(),
    email_hmac                 text not null,
    email_hmac_key_version     integer not null,
    verified_at                timestamptz,
    expires_at                 timestamptz not null,
    consumed_at                timestamptz,
    created_at                 timestamptz not null default now(),
    check (expires_at > created_at)
);

alter table public.billing_entitlements enable row level security;
alter table public.billing_entitlement_assignments enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.billing_recovery_challenges enable row level security;

create or replace function public.recompute_billing_projection(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
    v_plan text;
    v_source text;
    v_customer_id text;
    v_subscription_id text;
begin
    select e.plan, e.stripe_customer_id, e.stripe_subscription_id
    into v_plan, v_customer_id, v_subscription_id
    from public.billing_entitlements e
    where e.owner_user_id = p_user_id and e.status = 'active'
    order by case e.plan when 'lifetime' then 0 else 1 end, e.created_at asc
    limit 1;

    select b.plan_source into v_source
    from public.billing b
    where b.user_id = p_user_id;

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
    p_checkout_email_hmac_key_version integer default null
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

    insert into public.stripe_webhook_events (
        stripe_event_id, event_type, stripe_created_at, payload_digest, outcome
    ) values (
        p_event_id, p_event_type, p_stripe_created_at, p_payload_digest, 'unresolved'
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

    select c.email_hmac, c.email_hmac_key_version
    into v_challenge_email_hmac, v_challenge_key_version
    from public.billing_recovery_challenges c
    where c.id = p_challenge_id
      and c.verified_at is not null
      and c.consumed_at is null
      and c.expires_at > now()
    for update;

    if v_challenge_email_hmac is null
       or v_challenge_email_hmac <> v_entitlement_email_hmac
       or v_challenge_key_version <> v_entitlement_key_version then
        raise exception 'Fresh matching proof required';
    end if;

    select email_confirmed_at into v_owner_confirmed_at from auth.users where id = v_from_user_id;
    select email_confirmed_at into v_target_confirmed_at from auth.users where id = p_to_user_id;

    if v_target_confirmed_at is null then
        raise exception 'Target account email must be confirmed';
    end if;
    if v_owner_confirmed_at is not null then
        raise exception 'Manual review required for a confirmed owner';
    end if;

    update public.billing_entitlements
    set owner_user_id = p_to_user_id,
        owner_version = v_owner_version + 1,
        updated_at = now()
    where id = p_entitlement_id;

    insert into public.billing_entitlement_assignments (
        entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
    ) values (
        p_entitlement_id, v_from_user_id, p_to_user_id, 'email_recovery', p_challenge_id, v_owner_version + 1
    );

    update public.billing_recovery_challenges set consumed_at = now() where id = p_challenge_id;
    perform public.recompute_billing_projection(v_from_user_id);
    perform public.recompute_billing_projection(p_to_user_id);
    return true;
end; $$;

revoke all on public.billing_entitlements, public.billing_entitlement_assignments,
    public.stripe_webhook_events, public.billing_recovery_challenges from public, anon, authenticated;
revoke all on function public.recompute_billing_projection(uuid) from public, anon, authenticated;
revoke all on function public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer)
    from public, anon, authenticated;
revoke all on function public.claim_entitlement(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.recompute_billing_projection(uuid) to service_role;
grant execute on function public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer)
    to service_role;
grant execute on function public.claim_entitlement(uuid, uuid, uuid) to service_role;
