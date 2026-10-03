-- Run only against an isolated disposable PostgreSQL database with migrations 018 and 027 applied.
-- Lifecycle events must change status only. They must never change entitlement ownership.

begin;

insert into auth.users (id, email_confirmed_at) values
    ('00000000-0000-0000-0000-0000000000a1', null),
    ('00000000-0000-0000-0000-0000000000b2', now()),
    ('00000000-0000-0000-0000-0000000000c3', now()),
    ('00000000-0000-0000-0000-0000000000d4', null),
    ('00000000-0000-0000-0000-0000000000e5', null);

select * from public.record_stripe_entitlement(
    'evt_lifecycle_checkout',
    'checkout.session.completed',
    timestamptz '2026-08-29 00:00:00+00',
    'digest-lifecycle-checkout',
    'cs_lifecycle_1',
    '00000000-0000-0000-0000-0000000000a1',
    'pro',
    'active',
    null,
    'sub_lifecycle_1',
    'cus_lifecycle_1',
    'email-hmac-lifecycle',
    1
);

-- A proof of the Checkout email alone must not authorize a transfer to any
-- confirmed account. The proof is issued for account B, so a claim for C fails.
select * from public.record_stripe_entitlement(
    'evt_target_bound_checkout',
    'checkout.session.completed',
    timestamptz '2026-08-29 00:00:15+00',
    'digest-target-bound-checkout',
    'cs_target_bound_1',
    '00000000-0000-0000-0000-0000000000d4',
    'lifetime',
    'active',
    null,
    null,
    'cus_target_bound_1',
    'email-hmac-lifecycle',
    1
);

insert into public.billing_recovery_challenges (id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at)
values (
    '10000000-0000-0000-0000-000000000005',
    'email-hmac-lifecycle',
    1,
    '00000000-0000-0000-0000-0000000000b2',
    now(),
    now() + interval '10 minutes'
);

do $$
begin
    begin
        perform public.claim_entitlement(
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_target_bound_1'),
            '00000000-0000-0000-0000-0000000000c3',
            '10000000-0000-0000-0000-000000000005'
        );
        raise exception 'recovery proof unexpectedly transferred to a different confirmed account';
    exception when others then
        if sqlerrm <> 'Recovery proof target account mismatch' then
            raise;
        end if;
    end;
end $$;

-- The target binding is enforced by the assignment trigger too, so a privileged
-- writer cannot bypass claim_entitlement and attach B's proof to C.
insert into public.billing_recovery_challenges (
    id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at
) values (
    '10000000-0000-0000-0000-000000000006',
    'email-hmac-lifecycle',
    1,
    '00000000-0000-0000-0000-0000000000b2',
    now(),
    now() + interval '10 minutes'
);

do $$
begin
    begin
        insert into public.billing_entitlement_assignments (
            entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
        ) values (
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_target_bound_1'),
            '00000000-0000-0000-0000-0000000000d4',
            '00000000-0000-0000-0000-0000000000c3',
            'email_recovery',
            '10000000-0000-0000-0000-000000000006',
            2
        );
        raise exception 'target-bound proof unexpectedly authorized direct assignment';
    exception when others then
        if sqlerrm <> 'Fresh matching proof required' then
            raise;
        end if;
    end;
end $$;

-- Binding a proof to an account is insufficient if that account is still anonymous.
-- The database must reject a direct transfer before an unconfirmed target can own Pro.
select * from public.record_stripe_entitlement(
    'evt_unconfirmed_target_checkout',
    'checkout.session.completed',
    timestamptz '2026-08-29 00:00:20+00',
    'digest-unconfirmed-target-checkout',
    'cs_unconfirmed_target_1',
    '00000000-0000-0000-0000-0000000000d4',
    'lifetime',
    'active',
    null,
    null,
    'cus_unconfirmed_target_1',
    'email-hmac-lifecycle',
    1
);

insert into public.billing_recovery_challenges (
    id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at
) values (
    '10000000-0000-0000-0000-000000000007',
    'email-hmac-lifecycle',
    1,
    '00000000-0000-0000-0000-0000000000a1',
    now(),
    now() + interval '10 minutes'
);

-- The claim RPC must enforce the same confirmed-account condition as the table trigger.
do $$
begin
    begin
        perform public.claim_entitlement(
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_unconfirmed_target_1'),
            '00000000-0000-0000-0000-0000000000a1',
            '10000000-0000-0000-0000-000000000007'
        );
        raise exception 'unconfirmed target unexpectedly authorized recovery claim';
    exception when others then
        if sqlerrm <> 'Target account email must be confirmed' then
            raise;
        end if;
    end;
end $$;

do $$
begin
    begin
        insert into public.billing_entitlement_assignments (
            entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
        ) values (
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_unconfirmed_target_1'),
            '00000000-0000-0000-0000-0000000000d4',
            '00000000-0000-0000-0000-0000000000a1',
            'email_recovery',
            '10000000-0000-0000-0000-000000000007',
            2
        );
        raise exception 'unconfirmed target unexpectedly authorized direct assignment';
    exception when others then
        if sqlerrm <> 'Target account email must be confirmed' then
            raise;
        end if;
    end;
end $$;

-- Immutable payment identity and ownership may not be changed by direct table updates.
-- Ownership transfer remains a separate, append-only claim operation.
do $$
begin
    begin
        update public.billing_entitlements
        set origin_user_id = '00000000-0000-0000-0000-0000000000b2'
        where stripe_checkout_session_id = 'cs_lifecycle_1';
        raise exception 'direct origin identity update unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Immutable entitlement identity cannot be changed' then
            raise;
        end if;
    end;

    begin
        update public.billing_entitlements
        set owner_user_id = '00000000-0000-0000-0000-0000000000b2'
        where stripe_checkout_session_id = 'cs_lifecycle_1';
        raise exception 'direct owner update unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Immutable entitlement identity cannot be changed' then
            raise;
        end if;
    end;

    begin
        update public.billing_entitlements
        set owner_version = 2
        where stripe_checkout_session_id = 'cs_lifecycle_1';
        raise exception 'direct owner version update unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Immutable entitlement identity cannot be changed' then
            raise;
        end if;
    end;
end $$;

-- A privileged caller must not manufacture an assignment with a nonexistent recovery
-- challenge, then use it to satisfy the entitlement ownership trigger.
do $$
begin
    begin
        insert into public.billing_entitlement_assignments (
            entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
        ) values (
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_lifecycle_1'),
            '00000000-0000-0000-0000-0000000000a1',
            '00000000-0000-0000-0000-0000000000b2',
            'email_recovery',
            '10000000-0000-0000-0000-000000000099',
            2
        );
        raise exception 'unverified recovery assignment unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Fresh matching proof required' then
            raise;
        end if;
    end;
end $$;

-- Existing assignments are append-only. Otherwise a privileged caller could create an
-- innocuous row and mutate it into a forged email-recovery authorization later.
do $$
begin
    begin
        insert into public.billing_entitlement_assignments (
            entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
        ) values (
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_lifecycle_1'),
            '00000000-0000-0000-0000-0000000000a1',
            '00000000-0000-0000-0000-0000000000b2',
            'approved_historical_import',
            null,
            2
        );
        update public.billing_entitlement_assignments
        set reason = 'email_recovery',
            challenge_id = '10000000-0000-0000-0000-000000000099'
        where entitlement_id = (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_lifecycle_1')
          and owner_version = 2;
        raise exception 'recovery assignment mutation unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Immutable entitlement assignment cannot be changed' then
            raise;
        end if;
    end;
end $$;

-- Recovery freshness must use wall-clock time, not transaction-start time. A transaction
-- that lasts past a challenge expiry must not authorize a transfer.
insert into public.billing_recovery_challenges (id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at)
values (
    '10000000-0000-0000-0000-000000000003',
    'email-hmac-lifecycle',
    1,
    '00000000-0000-0000-0000-0000000000b2',
    now(),
    now() + interval '100 milliseconds'
);
select pg_sleep(0.2);
do $$
begin
    begin
        insert into public.billing_entitlement_assignments (
            entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
        ) values (
            (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_lifecycle_1'),
            '00000000-0000-0000-0000-0000000000a1',
            '00000000-0000-0000-0000-0000000000b2',
            'email_recovery',
            '10000000-0000-0000-0000-000000000003',
            2
        );
        raise exception 'expired recovery assignment unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Fresh matching proof required' then
            raise;
        end if;
    end;
end $$;

insert into public.billing_recovery_challenges (id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at)
values (
    '10000000-0000-0000-0000-000000000002',
    'email-hmac-lifecycle',
    1,
    '00000000-0000-0000-0000-0000000000b2',
    now(),
    now() + interval '10 minutes'
);

-- A recovery assignment is not a permanent owner-change authorization. Once its
-- proof is consumed, a privileged direct update must not use the stale row to transfer.
select * from public.record_stripe_entitlement(
    'evt_stale_assignment_checkout',
    'checkout.session.completed',
    timestamptz '2026-08-29 00:00:30+00',
    'digest-stale-assignment-checkout',
    'cs_stale_assignment_1',
    '00000000-0000-0000-0000-0000000000d4',
    'lifetime',
    'active',
    null,
    null,
    'cus_stale_assignment_1',
    'email-hmac-lifecycle',
    1
);

insert into public.billing_recovery_challenges (id, email_hmac, email_hmac_key_version, target_user_id, verified_at, expires_at)
values (
    '10000000-0000-0000-0000-000000000004',
    'email-hmac-lifecycle',
    1,
    '00000000-0000-0000-0000-0000000000b2',
    now(),
    now() + interval '10 minutes'
);

insert into public.billing_entitlement_assignments (
    entitlement_id, from_user_id, to_user_id, reason, challenge_id, owner_version
) values (
    (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_stale_assignment_1'),
    '00000000-0000-0000-0000-0000000000d4',
    '00000000-0000-0000-0000-0000000000b2',
    'email_recovery',
    '10000000-0000-0000-0000-000000000004',
    2
);

update public.billing_recovery_challenges
set consumed_at = now()
where id = '10000000-0000-0000-0000-000000000004';

-- Challenge evidence is immutable after issuance. A privileged writer cannot change
-- its email binding and repurpose it for a different entitlement.
do $$
begin
    begin
        update public.billing_recovery_challenges
        set email_hmac = 'forged-email-hmac'
        where id = '10000000-0000-0000-0000-000000000004';
        raise exception 'recovery challenge mutation unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Immutable recovery challenge cannot be changed' then
            raise;
        end if;
    end;
end $$;

do $$
begin
    begin
        update public.billing_entitlements
        set owner_user_id = '00000000-0000-0000-0000-0000000000b2',
            owner_version = 2
        where stripe_checkout_session_id = 'cs_stale_assignment_1';
        raise exception 'stale recovery assignment unexpectedly authorized transfer';
    exception when others then
        if sqlerrm <> 'Fresh matching proof required' then
            raise;
        end if;
    end;
end $$;

select public.claim_entitlement(
    (select id from public.billing_entitlements where stripe_checkout_session_id = 'cs_lifecycle_1'),
    '00000000-0000-0000-0000-0000000000b2',
    '10000000-0000-0000-0000-000000000002'
);

-- The bridge has no caller-supplied identity. Two human-reviewed immutable approval
-- records are the complete migration boundary. Legacy billing rows are deliberately
-- absent so stale local state cannot authorize a paid entitlement.
insert into public.billing_legacy_monthly_import_approvals (
    approval_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_subscription_id,
    stripe_customer_id, origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
    stripe_created_at, reviewed_at, expires_at, approved_by
) values
(
    'legacy_monthly:sub_legacy_monthly_1', 'cs_legacy_monthly_1', null, 'sub_legacy_monthly_1',
    'cus_legacy_monthly_1', '00000000-0000-0000-0000-0000000000c3', 'email-hmac-legacy-monthly', 1,
    timestamptz '2026-08-29 00:03:00+00', clock_timestamp(),
    clock_timestamp() + interval '15 minutes', 'human-review'
),
(
    'legacy_monthly:sub_legacy_monthly_2', 'cs_legacy_monthly_2', null, 'sub_legacy_monthly_2',
    'cus_legacy_monthly_2', '00000000-0000-0000-0000-0000000000c3', 'email-hmac-legacy-monthly-2', 1,
    timestamptz '2026-08-29 00:04:00+00', clock_timestamp(),
    clock_timestamp() + interval '15 minutes', 'human-review'
);

select * from public.import_approved_legacy_monthly_entitlement('sub_legacy_monthly_1');
select * from public.import_approved_legacy_monthly_entitlement('sub_legacy_monthly_1');

do $$
begin
    begin
        perform public.import_approved_legacy_monthly_entitlement('sub_legacy_monthly_unapproved');
        raise exception 'unapproved legacy subscription import unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Legacy monthly approval not found' then
            raise;
        end if;
    end;

    begin
        insert into public.billing_legacy_monthly_import_approvals (
            approval_id, stripe_checkout_session_id, stripe_subscription_id, stripe_customer_id,
            origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
            stripe_created_at, reviewed_at, expires_at, approved_by
        ) values (
            'legacy_monthly:sub_legacy_monthly_3', 'cs_legacy_monthly_3', 'sub_legacy_monthly_3',
            'cus_legacy_monthly_3', '00000000-0000-0000-0000-0000000000c3',
            'email-hmac-legacy-monthly-3', 1, timestamptz '2026-08-29 00:05:00+00',
            timestamptz '2026-09-03 00:00:00+00', timestamptz '2026-09-03 00:15:00+00', 'human-review'
        );
        raise exception 'third legacy monthly approval unexpectedly succeeded';
    exception when others then
        if sqlerrm <> 'Only two legacy monthly approvals are permitted' then
            raise;
        end if;
    end;
end $$;

-- A newer inactive subscription observation must revoke only the recovered owner's
-- derived monthly projection, never reassign the immutable checkout entitlement.
select * from public.record_stripe_subscription_lifecycle(
    'evt_lifecycle_inactive',
    'customer.subscription.deleted',
    timestamptz '2026-08-29 00:02:00+00',
    'digest-lifecycle-inactive',
    'sub_lifecycle_1',
    'inactive'
);

-- A late stale active event may be delivered after deletion, but must not restore Pro.
select * from public.record_stripe_subscription_lifecycle(
    'evt_lifecycle_stale_active',
    'customer.subscription.updated',
    timestamptz '2026-08-29 00:01:00+00',
    'digest-lifecycle-stale-active',
    'sub_lifecycle_1',
    'active'
);

-- Exact redelivery must be acknowledged as a no-op.
select * from public.record_stripe_subscription_lifecycle(
    'evt_lifecycle_inactive',
    'customer.subscription.deleted',
    timestamptz '2026-08-29 00:02:00+00',
    'digest-lifecycle-inactive',
    'sub_lifecycle_1',
    'inactive'
);

do $$
declare
    v_origin uuid;
    v_owner uuid;
    v_owner_version integer;
    v_status text;
    v_a_plan text;
    v_b_plan text;
    v_assignments integer;
    v_inactive_events integer;
    v_stale_events integer;
    v_duplicate_events integer;
    v_legacy_owner uuid;
    v_legacy_status text;
    v_legacy_plan text;
    v_legacy_projection_source text;
    v_legacy_projection_renews_at timestamptz;
    v_legacy_approval_consumed boolean;
    v_legacy_import_events integer;
    v_legacy_import_grants integer;
    v_expired_legacy_entitlements integer;
    v_anon_bridge_can_execute boolean;
    v_service_bridge_can_execute boolean;
    v_anon_can_execute boolean;
    v_service_can_execute boolean;
begin
    select origin_user_id, owner_user_id, owner_version, status
    into v_origin, v_owner, v_owner_version, v_status
    from public.billing_entitlements
    where stripe_subscription_id = 'sub_lifecycle_1';
    select plan into v_a_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000a1';
    select plan into v_b_plan from public.billing where user_id = '00000000-0000-0000-0000-0000000000b2';
    select count(*) into v_assignments from public.billing_entitlement_assignments;
    select count(*) into v_inactive_events from public.stripe_webhook_events
    where stripe_event_id = 'evt_lifecycle_inactive' and outcome = 'subscription_inactivated';
    select count(*) into v_stale_events from public.stripe_webhook_events
    where stripe_event_id = 'evt_lifecycle_stale_active' and outcome = 'subscription_stale';
    select count(*) into v_duplicate_events from public.stripe_webhook_events
    where stripe_event_id = 'evt_lifecycle_inactive' and outcome = 'subscription_inactivated';
    select owner_user_id, status, plan
    into v_legacy_owner, v_legacy_status, v_legacy_plan
    from public.billing_entitlements
    where stripe_subscription_id = 'sub_legacy_monthly_1';
    select plan_source, plan_renews_at
    into v_legacy_projection_source, v_legacy_projection_renews_at
    from public.billing
    where user_id = '00000000-0000-0000-0000-0000000000c3';
    select consumed_at is not null and entitlement_id is not null into v_legacy_approval_consumed
    from public.billing_legacy_monthly_import_approvals
    where stripe_subscription_id = 'sub_legacy_monthly_1';
    select count(*) into v_legacy_import_events from public.stripe_webhook_events
    where stripe_event_id = 'legacy_monthly:sub_legacy_monthly_1';
    select count(*) into v_legacy_import_grants from public.stripe_webhook_events
    where event_type = 'approved_historical_import' and outcome = 'granted';
    select count(*) into v_expired_legacy_entitlements from public.billing_entitlements
    where stripe_subscription_id = 'sub_expired_legacy';
    select has_function_privilege('anon', 'public.import_approved_legacy_monthly_entitlement(text)', 'execute')
    into v_anon_bridge_can_execute;
    select has_function_privilege('service_role', 'public.import_approved_legacy_monthly_entitlement(text)', 'execute')
    into v_service_bridge_can_execute;
    select has_function_privilege('anon', 'public.record_stripe_subscription_lifecycle(text, text, timestamptz, text, text, text)', 'execute')
    into v_anon_can_execute;
    select has_function_privilege('service_role', 'public.record_stripe_subscription_lifecycle(text, text, timestamptz, text, text, text)', 'execute')
    into v_service_can_execute;

    if v_origin <> '00000000-0000-0000-0000-0000000000a1'::uuid
       or v_owner <> '00000000-0000-0000-0000-0000000000b2'::uuid
       or v_owner_version <> 2
       or v_status <> 'inactive'
       or v_a_plan <> 'free'
       or v_b_plan <> 'free'
       or v_assignments <> 2
       or v_inactive_events <> 1
       or v_stale_events <> 1
       or v_duplicate_events <> 1
       or v_legacy_owner <> '00000000-0000-0000-0000-0000000000c3'::uuid
       or v_legacy_status <> 'active'
       or v_legacy_plan <> 'pro'
       or v_legacy_projection_source <> 'stripe_entitlement_monthly'
       or v_legacy_projection_renews_at is not null
       or not v_legacy_approval_consumed
       or v_legacy_import_events <> 0
       or v_legacy_import_grants <> 0
       or v_expired_legacy_entitlements <> 0
       or v_anon_bridge_can_execute
       or not v_service_bridge_can_execute
       or v_anon_can_execute
       or not v_service_can_execute then
        raise exception 'subscription lifecycle invariant failed: origin %, owner %, version %, status %, A %, B %, assignments %, inactive %, stale %, duplicate %, anon %, service %',
            v_origin, v_owner, v_owner_version, v_status, v_a_plan, v_b_plan, v_assignments,
            v_inactive_events, v_stale_events, v_duplicate_events, v_anon_can_execute, v_service_can_execute;
    end if;
end $$;

rollback;
