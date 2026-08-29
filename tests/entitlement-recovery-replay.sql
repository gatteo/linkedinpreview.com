-- Run only against an isolated disposable PostgreSQL database with migrations 018 and 027 applied.
-- It proves the T5 replay invariant without touching the production Supabase project.

begin;

insert into auth.users (id, email_confirmed_at) values
    ('00000000-0000-0000-0000-0000000000a1', null),
    ('00000000-0000-0000-0000-0000000000b2', now());

select * from public.record_stripe_entitlement(
    'evt_test_1',
    'checkout.session.completed',
    now(),
    'digest-1',
    'cs_test_1',
    '00000000-0000-0000-0000-0000000000a1',
    'lifetime',
    'active',
    'pi_test_1',
    null,
    'cus_test_1',
    'email-hmac-1',
    1
);

insert into public.billing_recovery_challenges (id, email_hmac, email_hmac_key_version, verified_at, expires_at)
values ('10000000-0000-0000-0000-000000000001', 'email-hmac-1', 1, now(), now() + interval '10 minutes');

select public.claim_entitlement(
    (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_test_1'),
    '00000000-0000-0000-0000-0000000000b2',
    '10000000-0000-0000-0000-000000000001'
);

-- Exact and distinct Stripe event redelivery must never restore owner A.
select * from public.record_stripe_entitlement(
    'evt_test_1', 'checkout.session.completed', now(), 'digest-1', 'cs_test_1',
    '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_test_1', null,
    'cus_test_1', 'email-hmac-1', 1
);
select * from public.record_stripe_entitlement(
    'evt_test_2', 'checkout.session.completed', now(), 'digest-2', 'cs_test_1',
    '00000000-0000-0000-0000-0000000000a1', 'lifetime', 'active', 'pi_test_1', null,
    'cus_test_1', 'email-hmac-1', 1
);

do $$
declare
    v_owner uuid;
    v_a_plan text;
    v_b_plan text;
    v_assignments integer;
    v_entitlements integer;
    v_events integer;
    v_capture_events integer;
    v_anon_can_execute boolean;
    v_service_can_execute boolean;
begin
    select owner_user_id into v_owner from public.billing_entitlements where stripe_checkout_session_id = 'cs_test_1';
    select plan into v_a_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000a1';
    select plan into v_b_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000b2';
    select count(*) into v_assignments from public.billing_entitlement_assignments;
    select count(*) into v_entitlements from public.billing_entitlements;
    select count(*) into v_events from public.stripe_webhook_events;
    select count(*) into v_capture_events from public.stripe_webhook_events where outcome = 'granted';
    select has_function_privilege('anon', 'public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer)', 'execute') into v_anon_can_execute;
    select has_function_privilege('service_role', 'public.record_stripe_entitlement(text, text, timestamptz, text, text, uuid, text, text, text, text, text, text, integer)', 'execute') into v_service_can_execute;

    if v_owner <> '00000000-0000-0000-0000-0000000000b2'::uuid
       or v_a_plan <> 'free'
       or v_b_plan <> 'lifetime'
       or v_assignments <> 1
       or v_entitlements <> 1
       or v_events <> 2
       or v_capture_events <> 1
       or v_anon_can_execute
       or not v_service_can_execute then
        raise exception 'replay invariant or RPC privilege failed: owner %, A %, B %, assignments %, entitlements %, events %, grants %, anon %, service %',
            v_owner, v_a_plan, v_b_plan, v_assignments, v_entitlements, v_events, v_capture_events, v_anon_can_execute, v_service_can_execute;
    end if;
end $$;

rollback;
