-- Run only against an isolated disposable PostgreSQL database with migrations 018, 032 and 034 applied.
-- The transitional reader must preserve paid access from the active immutable ledger or the caller's paid legacy row.

begin;

insert into auth.users (id, email_confirmed_at) values
    ('00000000-0000-0000-0000-0000000000a1', now()),
    ('00000000-0000-0000-0000-0000000000b2', now()),
    ('00000000-0000-0000-0000-0000000000c3', now()),
    ('00000000-0000-0000-0000-0000000000d4', now()),
    ('00000000-0000-0000-0000-0000000000e5', now()),
    ('00000000-0000-0000-0000-0000000000f6', now()),
    ('00000000-0000-0000-0000-0000000000a7', now()),
    ('00000000-0000-0000-0000-0000000000a8', now());

-- User A represents an unresolved/manual-exception-equivalent historical paid
-- account. During a ledger transition it must retain legacy paid access.
insert into public.billing (user_id, plan, plan_source, stripe_customer_id, stripe_subscription_id) values
    ('00000000-0000-0000-0000-0000000000a1', 'lifetime', 'stripe_lifetime', 'cus_legacy_a', null),
    ('00000000-0000-0000-0000-0000000000b2', 'free', null, null, null),
    ('00000000-0000-0000-0000-0000000000c3', 'free', null, null, null),
    ('00000000-0000-0000-0000-0000000000d4', 'pro', 'stripe_monthly', 'cus_legacy_d', 'sub_legacy_d');

select * from public.record_stripe_entitlement(
    'evt_reader_b', 'checkout.session.completed', timestamptz '2026-09-03 04:00:00+00',
    'digest-reader-b', 'cs_reader_b', '00000000-0000-0000-0000-0000000000b2',
    'pro', 'active', null, 'sub_reader_b', 'cus_reader_b', 'email-reader-b', 1
);
select * from public.record_stripe_entitlement(
    'evt_reader_c_pro', 'checkout.session.completed', timestamptz '2026-09-03 04:01:00+00',
    'digest-reader-c-pro', 'cs_reader_c_pro', '00000000-0000-0000-0000-0000000000c3',
    'pro', 'active', null, 'sub_reader_c_pro', 'cus_reader_c_pro', 'email-reader-c-pro', 1
);
select * from public.record_stripe_entitlement(
    'evt_reader_c_lifetime', 'checkout.session.completed', timestamptz '2026-09-03 04:02:00+00',
    'digest-reader-c-lifetime', 'cs_reader_c_lifetime', '00000000-0000-0000-0000-0000000000c3',
    'lifetime', 'active', null, null, 'cus_reader_c_lifetime', 'email-reader-c-lifetime', 1
);
select * from public.record_stripe_entitlement(
    'evt_reader_d', 'checkout.session.completed', timestamptz '2026-09-03 04:03:00+00',
    'digest-reader-d', 'cs_reader_d', '00000000-0000-0000-0000-0000000000d4',
    'lifetime', 'active', null, null, 'cus_reader_d', 'email-reader-d', 1
);
update public.billing_entitlements set status = 'inactive' where stripe_checkout_session_id = 'cs_reader_d';
-- The historical legacy record is still paid. An unrelated ledger lifecycle
-- observation must not revoke it during the monotonic dual-read transition.
update public.billing
set plan = 'pro', plan_source = 'stripe_monthly', stripe_customer_id = 'cus_legacy_d', stripe_subscription_id = 'sub_legacy_d'
where user_id = '00000000-0000-0000-0000-0000000000d4';

-- User F has an active ledger Pro entitlement but an unresolved legacy lifetime
-- record. Lifetime must win across sources so the transition cannot downgrade it.
select * from public.record_stripe_entitlement(
    'evt_reader_f_pro', 'checkout.session.completed', timestamptz '2026-09-03 04:04:00+00',
    'digest-reader-f-pro', 'cs_reader_f_pro', '00000000-0000-0000-0000-0000000000f6',
    'pro', 'active', null, 'sub_reader_f_pro', 'cus_reader_f_pro', 'email-reader-f-pro', 1
);
update public.billing
set plan = 'lifetime', plan_source = 'stripe_lifetime', stripe_customer_id = 'cus_legacy_f', stripe_subscription_id = null
where user_id = '00000000-0000-0000-0000-0000000000f6';

-- User A7 has one legacy Pro record and one immutable entitlement with the
-- same Stripe subscription identity. A terminal inactive ledger observation
-- must revoke that exact legacy fallback rather than continue authorizing it.
insert into public.billing (user_id, plan, plan_source, stripe_customer_id, stripe_subscription_id) values
    ('00000000-0000-0000-0000-0000000000a7', 'pro', 'stripe_monthly', 'cus_reader_a7', 'sub_reader_a7');
select * from public.record_stripe_entitlement(
    'evt_reader_a7', 'checkout.session.completed', timestamptz '2026-09-03 13:30:00+00',
    'digest-reader-a7', 'cs_reader_a7', '00000000-0000-0000-0000-0000000000a7',
    'pro', 'active', null, 'sub_reader_a7', 'cus_reader_a7', 'email-reader-a7', 1
);
update public.billing_entitlements
set status = 'inactive'
where stripe_checkout_session_id = 'cs_reader_a7';

-- User A8 has a matching legacy Pro record and disputed immutable entitlement.
-- A dispute is terminal for the original payment identity and must deny the
-- legacy fallback just like an inactive subscription.
insert into public.billing (user_id, plan, plan_source, stripe_customer_id, stripe_subscription_id) values
    ('00000000-0000-0000-0000-0000000000a8', 'pro', 'stripe_monthly', 'cus_reader_a8', 'sub_reader_a8');
select * from public.record_stripe_entitlement(
    'evt_reader_a8', 'checkout.session.completed', timestamptz '2026-09-03 13:31:00+00',
    'digest-reader-a8', 'cs_reader_a8', '00000000-0000-0000-0000-0000000000a8',
    'pro', 'active', null, 'sub_reader_a8', 'cus_reader_a8', 'email-reader-a8', 1
);
update public.billing_entitlements
set status = 'disputed'
where stripe_checkout_session_id = 'cs_reader_a8';


-- Same-plan ties must have stable ordering. User E has no mutable billing row.
insert into public.billing_entitlements (
    id, stripe_checkout_session_id, stripe_subscription_id, stripe_customer_id,
    origin_user_id, owner_user_id, plan, status, stripe_created_at, created_at
) values
    (
        '10000000-0000-0000-0000-000000000011', 'cs_reader_e_first', 'sub_reader_e_first', 'cus_reader_e_first',
        '00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000e5', 'pro', 'active',
        timestamptz '2026-09-03 04:05:00+00', timestamptz '2026-09-03 04:05:00+00'
    ),
    (
        '10000000-0000-0000-0000-000000000012', 'cs_reader_e_second', 'sub_reader_e_second', 'cus_reader_e_second',
        '00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000e5', 'pro', 'active',
        timestamptz '2026-09-03 04:05:00+00', timestamptz '2026-09-03 04:05:00+00'
    );

-- The function reads the authenticated caller from auth.uid(). Every call returns
-- exactly one minimal record, including a free default when neither the active
-- ledger nor the monotonic legacy fallback authorizes paid access.
set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000a1';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'lifetime' or v_customer <> 'cus_legacy_a' or v_subscription is not null then
        raise exception 'legacy paid fallback failed: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000b2';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'pro' or v_customer <> 'cus_reader_b' or v_subscription <> 'sub_reader_b' then
        raise exception 'ledger pro reader failed: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000c3';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'lifetime' or v_customer <> 'cus_reader_c_lifetime' or v_subscription is not null then
        raise exception 'lifetime precedence reader failed: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000d4';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'pro' or v_customer <> 'cus_legacy_d' or v_subscription <> 'sub_legacy_d' then
        raise exception 'inactive ledger must retain legacy paid access: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000f6';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'lifetime' or v_customer <> 'cus_legacy_f' or v_subscription is not null then
        raise exception 'legacy lifetime must outrank active ledger pro: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000a7';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'free' or v_customer is not null or v_subscription is not null then
        raise exception 'same-identity inactive ledger must revoke legacy access: %, %, %, %',
            v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000a8';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'free' or v_customer is not null or v_subscription is not null then
        raise exception 'same-identity disputed ledger must revoke legacy access: %, %, %, %',
            v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;


set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000e5';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'pro' or v_customer <> 'cus_reader_e_first' or v_subscription <> 'sub_reader_e_first' then
        raise exception 'same-plan deterministic reader failed: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

-- An authenticated caller without a JWT subject must receive a single free
-- fallback, never an arbitrary ledger or legacy paid record.
set local "request.jwt.claim.sub" = '';
do $$
declare
    v_count integer;
    v_plan text;
    v_customer text;
    v_subscription text;
begin
    select count(*), max(plan), max(stripe_customer_id), max(stripe_subscription_id)
    into v_count, v_plan, v_customer, v_subscription
    from public.current_authorized_entitlement();
    if v_count <> 1 or v_plan <> 'free' or v_customer is not null or v_subscription is not null then
        raise exception 'authenticated no-JWT reader fallback failed: %, %, %, %', v_count, v_plan, v_customer, v_subscription;
    end if;
end $$;

-- The authenticated role can use the narrow reader but cannot directly inspect
-- any immutable ledger row, including another user's payment identifiers.
do $$
begin
    begin
        perform 1 from public.billing_entitlements;
        raise exception 'authenticated role unexpectedly read immutable ledger rows';
    exception when insufficient_privilege then
        null;
    end;
end $$;

reset role;
set local role anon;
do $$
begin
    begin
        perform 1 from public.current_authorized_entitlement();
        raise exception 'anon unexpectedly executed current entitlement reader';
    exception when insufficient_privilege then
        null;
    end;

    begin
        perform 1 from public.billing_entitlements;
        raise exception 'anon unexpectedly read immutable ledger rows';
    exception when insufficient_privilege then
        null;
    end;
end $$;

rollback;
