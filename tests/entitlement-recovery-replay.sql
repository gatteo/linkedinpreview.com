-- Run only against an isolated disposable PostgreSQL database with migrations 018 and 032 applied.
-- It proves the T5 replay invariant without touching the production Supabase project.

begin;

insert into auth.users (id, email_confirmed_at) values
    ('00000000-0000-0000-0000-0000000000a1', null),
    ('00000000-0000-0000-0000-0000000000b2', now()),
    ('00000000-0000-0000-0000-0000000000c3', now());

select * from public.record_stripe_entitlement(
    'evt_test_1',
    'checkout.session.completed',
    timestamptz '2026-09-03 13:30:00+00',
    'digest-1',
    'cs_test_1',
    '00000000-0000-0000-0000-0000000000a1',
    'lifetime',
    'active',
    'pi_test_1',
    null,
    'cus_test_1',
    'email-hmac-1',
    1,
    timestamptz '2026-09-03 13:31:00+00'
);

insert into public.billing_recovery_challenges (id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at)
values (
    '10000000-0000-0000-0000-000000000001',
    'email-hmac-1',
    1,
    '00000000-0000-0000-0000-0000000000b2',
    now(),
    now() + interval '10 minutes'
);

select public.claim_entitlement(
    (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_test_1'),
    '00000000-0000-0000-0000-0000000000b2',
    '10000000-0000-0000-0000-000000000001'
);

-- A legacy lifetime row must never be downgraded by an independent new monthly purchase.
insert into public.billing (user_id, plan, plan_source)
values ('00000000-0000-0000-0000-0000000000c3', 'lifetime', 'stripe_lifetime');

select * from public.record_stripe_entitlement(
    'evt_test_legacy_monthly',
    'checkout.session.completed',
    now(),
    'digest-legacy-monthly',
    'cs_test_legacy_monthly',
    '00000000-0000-0000-0000-0000000000c3',
    'pro',
    'active',
    null,
    'sub_test_legacy_monthly',
    'cus_test_legacy_monthly',
    'email-hmac-legacy-monthly',
    1
);

-- Exact and distinct Stripe event redelivery must never restore owner A.
select * from public.record_stripe_entitlement(
    'evt_test_1', 'checkout.session.completed', timestamptz '2026-09-03 13:30:00+00', 'digest-1', 'cs_test_1',
    '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_test_1', null,
    'cus_test_1', 'email-hmac-1', 1
);
select * from public.record_stripe_entitlement(
    'evt_test_2', 'checkout.session.completed', timestamptz '2026-09-03 13:30:00+00', 'digest-2', 'cs_test_1',
    '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_test_1', null,
    'cus_test_1', 'email-hmac-1', 1
);

-- A second signed event for the same Checkout Session must match every canonical
-- immutable identity field. A collision cannot be acknowledged as a replay.
do $$
begin
    begin
        perform public.record_stripe_entitlement(
            'evt_test_identity_conflict', 'checkout.session.completed', now(), 'digest-conflict', 'cs_test_1',
            '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_test_1', null,
            'cus_wrong', 'email-hmac-1', 1
        );
        raise exception 'mismatched Checkout identity unexpectedly replayed';
    exception when others then
        if sqlerrm <> 'Checkout entitlement identity conflict' then
            raise;
        end if;
    end;

    begin
        update public.stripe_webhook_events
        set payload_digest = 'forged-digest'
        where stripe_event_id = 'evt_test_1';
        raise exception 'finalized Stripe event unexpectedly changed';
    exception when others then
        if sqlerrm <> 'Immutable Stripe webhook event cannot be changed' then
            raise;
        end if;
    end;

    begin
        delete from public.stripe_webhook_events where stripe_event_id = 'evt_test_1';
        raise exception 'finalized Stripe event unexpectedly deleted';
    exception when others then
        if sqlerrm <> 'Immutable Stripe webhook event cannot be changed' then
            raise;
        end if;
    end;
end $$;

do $$
declare
    v_owner uuid;
    v_a_plan text;
    v_b_plan text;
    v_legacy_plan text;
    v_assignments integer;
    v_entitlements integer;
    v_events integer;
    v_capture_events integer;
    v_checkout_created_at timestamptz;
    v_event_created_at timestamptz;
    v_anon_can_execute boolean;
    v_service_can_execute boolean;
begin
    select owner_user_id into v_owner from public.billing_entitlements where stripe_checkout_session_id = 'cs_test_1';
    select plan into v_a_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000a1';
    select plan into v_b_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000b2';
    select plan into v_legacy_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000c3';
    select count(*) into v_assignments from public.billing_entitlement_assignments;
    select count(*) into v_entitlements from public.billing_entitlements;
    select count(*) into v_events from public.stripe_webhook_events;
    select count(*) into v_capture_events from public.stripe_webhook_events where outcome = 'granted';
    select stripe_created_at into v_checkout_created_at
    from public.billing_entitlements where stripe_checkout_session_id = 'cs_test_1';
    select stripe_created_at into v_event_created_at
    from public.stripe_webhook_events where stripe_event_id = 'evt_test_1';
    select has_function_privilege('anon', 'public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer, timestamptz)', 'execute') into v_anon_can_execute;
    select has_function_privilege('service_role', 'public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer, timestamptz)', 'execute') into v_service_can_execute;

    if v_owner <> '00000000-0000-0000-0000-0000000000b2'::uuid
       or v_a_plan <> 'free'
       or v_b_plan <> 'lifetime'
       or v_legacy_plan <> 'lifetime'
       or v_assignments <> 1
       or v_entitlements <> 2
       or v_events <> 3
       or v_capture_events <> 2
       or v_checkout_created_at <> timestamptz '2026-09-03 13:30:00+00'
       or v_event_created_at <> timestamptz '2026-09-03 13:31:00+00'
       or v_anon_can_execute
       or not v_service_can_execute then
        raise exception 'replay invariant or RPC privilege failed: owner %, A %, B %, assignments %, entitlements %, events %, grants %, anon %, service %',
            v_owner, v_a_plan, v_b_plan, v_assignments, v_entitlements, v_events, v_capture_events, v_anon_can_execute, v_service_can_execute;
    end if;
end $$;

rollback;
