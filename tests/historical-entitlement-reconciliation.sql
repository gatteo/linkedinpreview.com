-- Run only against an isolated disposable PostgreSQL database with migrations 018, 027 and 028 applied.
-- This is a dry-run reconciliation contract. It contains synthetic identifiers only.
-- No production data, Stripe response, email or user identifier is represented here.

begin;

insert into auth.users (id, email_confirmed_at) values
    ('00000000-0000-0000-0000-0000000000a1', now()),
    ('00000000-0000-0000-0000-0000000000b2', now()),
    ('00000000-0000-0000-0000-0000000000c3', now()),
    ('00000000-0000-0000-0000-0000000000d4', now()),
    ('00000000-0000-0000-0000-0000000000e5', now());

-- The mutable projection models the four current paid accounts at a frozen cutoff.
-- Two canonical Stripe candidates can be imported. Two unmatched paid accounts must
-- remain manual exceptions and must not become free during a partial import.
insert into public.billing (user_id, plan, plan_source, updated_at) values
    ('00000000-0000-0000-0000-0000000000a1', 'lifetime', 'stripe_lifetime', now()),
    ('00000000-0000-0000-0000-0000000000b2', 'pro', 'stripe_monthly', now()),
    ('00000000-0000-0000-0000-0000000000c3', 'lifetime', 'stripe_lifetime', now()),
    ('00000000-0000-0000-0000-0000000000d4', 'pro', 'stripe_monthly', now());

-- A generic run owns the frozen manifest and complete disposition counts. It must
-- support both plans, unlike the fixed two-monthly bridge in 027.
insert into public.billing_entitlement_reconciliation_runs (
    id, cutoff_at, manifest_digest, expected_paid_account_count,
    expected_paid_checkout_session_count, approved_by, approved_at
) values (
    '20000000-0000-0000-0000-000000000001',
    timestamptz '2026-09-03 08:41:00+00',
    'synthetic-manifest-digest-v1', 4, 2, 'human-review', clock_timestamp()
);

-- The approval path is evidence-led: no mutable billing identity is an importer
-- input. Every expected paid account has exactly one reviewed disposition. C and D
-- intentionally have no Checkout Session and are protected manual exceptions.
insert into public.billing_entitlement_reconciliation_approvals (
    reconciliation_run_id, disposition, plan, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id,
    origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
    stripe_created_at, canonical_status, status_observed_at, evidence_digest,
    reviewed_by, reviewed_at, expires_at, exception_reason
) values
(
    '20000000-0000-0000-0000-000000000001', 'approved_import', 'lifetime',
    'cs_reconciliation_lifetime_1', 'pi_reconciliation_lifetime_1', null,
    'cus_reconciliation_lifetime_1', '00000000-0000-0000-0000-0000000000a1',
    'hmac-reconciliation-lifetime', 1, timestamptz '2026-08-01 00:00:00+00',
    'active', timestamptz '2026-09-03 08:40:00+00', 'evidence-lifetime-v1',
    'human-review', clock_timestamp(), clock_timestamp() + interval '15 minutes', null
),
(
    '20000000-0000-0000-0000-000000000001', 'approved_import', 'pro',
    'cs_reconciliation_monthly_1', 'pi_reconciliation_monthly_1', 'sub_reconciliation_monthly_1',
    'cus_reconciliation_monthly_1', '00000000-0000-0000-0000-0000000000b2',
    'hmac-reconciliation-monthly', 1, timestamptz '2026-08-02 00:00:00+00',
    'active', timestamptz '2026-09-03 08:40:00+00', 'evidence-monthly-v1',
    'human-review', clock_timestamp(), clock_timestamp() + interval '15 minutes', null
),
(
    '20000000-0000-0000-0000-000000000001', 'manual_exception', 'lifetime',
    null, null, null, null, '00000000-0000-0000-0000-0000000000c3', null, null,
    null, 'active', timestamptz '2026-09-03 08:40:00+00', 'exception-lifetime-v1',
    'human-review', clock_timestamp(), null, 'No canonical paid Checkout Session mapping at cutoff'
),
(
    '20000000-0000-0000-0000-000000000001', 'manual_exception', 'pro',
    null, null, null, null, '00000000-0000-0000-0000-0000000000d4', null, null,
    null, 'active', timestamptz '2026-09-03 08:40:00+00', 'exception-monthly-v1',
    'human-review', clock_timestamp(), null, 'No canonical paid Checkout Session mapping at cutoff'
);

-- A frozen manifest must be sealed before any approval can import. Otherwise
-- a privileged writer could alter the approved population between imports.
do $$
begin
    begin
        perform public.import_approved_historical_entitlement(
            '20000000-0000-0000-0000-000000000001',
            'cs_reconciliation_lifetime_1'
        );
        raise exception 'unsealed reconciliation unexpectedly imported';
    exception when others then
        if sqlerrm <> 'Historical reconciliation approval evidence is unsealed' then
            raise;
        end if;
    end;
end $$;

select public.seal_historical_entitlement_reconciliation(
    '20000000-0000-0000-0000-000000000001'
);

-- A sealed approval set is immutable. Adding a reviewed-looking row after the
-- digest was frozen must fail rather than invalidate a future import.
do $$
begin
    begin
        insert into public.billing_entitlement_reconciliation_approvals (
            reconciliation_run_id, disposition, plan, origin_user_id,
            canonical_status, status_observed_at, evidence_digest,
            reviewed_by, reviewed_at, exception_reason
        ) values (
            '20000000-0000-0000-0000-000000000001', 'manual_exception', 'lifetime',
            '00000000-0000-0000-0000-0000000000e5', 'active', clock_timestamp(),
            'exception-after-seal-v1', 'human-review', clock_timestamp(), 'Late row must fail'
        );
        raise exception 'sealed reconciliation unexpectedly accepted an approval';
    exception when others then
        if sqlerrm <> 'Historical reconciliation approval evidence is sealed' then
            raise;
        end if;
    end;
end $$;

-- A partial import must create only the reviewed immutable lifetime entitlement.
-- It must not revoke or modify either unresolved paid legacy account.
select * from public.import_approved_historical_entitlement(
    '20000000-0000-0000-0000-000000000001',
    'cs_reconciliation_lifetime_1'
);

-- Generic importer must support the monthly candidate in the same manifest and be
-- replay-safe without creating a synthetic purchase conversion.
select * from public.import_approved_historical_entitlement(
    '20000000-0000-0000-0000-000000000001',
    'cs_reconciliation_monthly_1'
);
select * from public.import_approved_historical_entitlement(
    '20000000-0000-0000-0000-000000000001',
    'cs_reconciliation_monthly_1'
);

do $$
declare
    v_approved_entitlements integer;
    v_manual_entitlements integer;
    v_manual_paid_legacy integer;
    v_consumed_approvals integer;
    v_import_events integer;
    v_anon_import boolean;
    v_authenticated_import boolean;
    v_anon_seal boolean;
    v_authenticated_seal boolean;
begin
    select count(*) into v_approved_entitlements
    from public.billing_entitlements
    where stripe_checkout_session_id in (
        'cs_reconciliation_lifetime_1', 'cs_reconciliation_monthly_1'
    )
      and status = 'active';

    select count(*) into v_manual_entitlements
    from public.billing_entitlements
    where origin_user_id in (
        '00000000-0000-0000-0000-0000000000c3',
        '00000000-0000-0000-0000-0000000000d4'
    );

    select count(*) into v_manual_paid_legacy
    from public.billing
    where user_id in (
        '00000000-0000-0000-0000-0000000000c3',
        '00000000-0000-0000-0000-0000000000d4'
    )
      and plan in ('pro', 'lifetime');

    select count(*) into v_consumed_approvals
    from public.billing_entitlement_reconciliation_approvals
    where disposition = 'approved_import'
      and consumed_at is not null
      and entitlement_id is not null;

    select count(*) into v_import_events
    from public.stripe_webhook_events
    where event_type = 'approved_historical_import';

    select has_function_privilege('anon',
        'public.import_approved_historical_entitlement(uuid,text)', 'execute'
    ) into v_anon_import;
    select has_function_privilege('authenticated',
        'public.import_approved_historical_entitlement(uuid,text)', 'execute'
    ) into v_authenticated_import;
    select has_function_privilege('anon',
        'public.seal_historical_entitlement_reconciliation(uuid)', 'execute'
    ) into v_anon_seal;
    select has_function_privilege('authenticated',
        'public.seal_historical_entitlement_reconciliation(uuid)', 'execute'
    ) into v_authenticated_seal;

    if v_approved_entitlements <> 2 then
        raise exception 'generic reconciliation must import both approved plan types, got %', v_approved_entitlements;
    end if;
    if v_manual_entitlements <> 0 then
        raise exception 'manual exceptions must not be guessed into immutable entitlements, got %', v_manual_entitlements;
    end if;
    if v_manual_paid_legacy <> 2 then
        raise exception 'partial import made a manual exception free, got % paid legacy accounts', v_manual_paid_legacy;
    end if;
    if v_consumed_approvals <> 2 then
        raise exception 'each approved candidate must consume once, got %', v_consumed_approvals;
    end if;
    if v_import_events <> 0 then
        raise exception 'historical imports must not create synthetic webhook conversion events, got %', v_import_events;
    end if;
    if v_anon_import or v_authenticated_import then
        raise exception 'application roles must not execute the historical importer';
    end if;
    if v_anon_seal or v_authenticated_seal then
        raise exception 'application roles must not execute the historical sealer';
    end if;
end $$;

-- A generic importer must reject an incomplete run rather than gradually importing
-- whatever approvals happen to exist. The stated frozen population is two accounts,
-- yet this run contains only one reviewed candidate.
insert into public.billing_entitlement_reconciliation_runs (
    id, cutoff_at, manifest_digest, expected_paid_account_count,
    expected_paid_checkout_session_count, approved_by, approved_at
) values (
    '20000000-0000-0000-0000-000000000002',
    timestamptz '2026-09-03 08:41:00+00',
    'synthetic-incomplete-manifest-digest-v1', 2, 1, 'human-review', clock_timestamp()
);

insert into public.billing_entitlement_reconciliation_approvals (
    reconciliation_run_id, disposition, plan, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id,
    origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
    stripe_created_at, canonical_status, status_observed_at, evidence_digest,
    reviewed_by, reviewed_at, expires_at, exception_reason
) values (
    '20000000-0000-0000-0000-000000000002', 'approved_import', 'lifetime',
    'cs_reconciliation_incomplete_1', 'pi_reconciliation_incomplete_1', null,
    'cus_reconciliation_incomplete_1', '00000000-0000-0000-0000-0000000000a1',
    'hmac-reconciliation-incomplete', 1, timestamptz '2026-08-03 00:00:00+00',
    'active', timestamptz '2026-09-03 08:40:00+00', 'evidence-incomplete-v1',
    'human-review', clock_timestamp(), clock_timestamp() + interval '15 minutes', null
);

do $$
begin
    begin
        perform public.seal_historical_entitlement_reconciliation(
            '20000000-0000-0000-0000-000000000002'
        );
        raise exception 'incomplete reconciliation manifest unexpectedly sealed';
    exception when others then
        if sqlerrm <> 'Historical reconciliation manifest incomplete' then
            raise;
        end if;
    end;
end $$;

-- A matching immutable identity that is already refunded cannot be re-imported
-- as active historical paid access.
insert into public.billing_entitlement_reconciliation_runs (
    id, cutoff_at, manifest_digest, expected_paid_account_count,
    expected_paid_checkout_session_count, approved_by, approved_at
) values (
    '20000000-0000-0000-0000-000000000003',
    timestamptz '2026-09-03 08:41:00+00',
    'synthetic-refunded-collision-manifest-v1', 1, 1, 'human-review', clock_timestamp()
);
insert into public.billing_entitlement_reconciliation_approvals (
    reconciliation_run_id, disposition, plan, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id,
    origin_user_id, checkout_email_hmac, checkout_email_hmac_key_version,
    stripe_created_at, canonical_status, status_observed_at, evidence_digest,
    reviewed_by, reviewed_at, expires_at, exception_reason
) values (
    '20000000-0000-0000-0000-000000000003', 'approved_import', 'lifetime',
    'cs_reconciliation_refunded_1', 'pi_reconciliation_refunded_1', null,
    'cus_reconciliation_refunded_1', '00000000-0000-0000-0000-0000000000e5',
    'hmac-reconciliation-refunded', 1, timestamptz '2026-08-04 00:00:00+00',
    'active', timestamptz '2026-09-03 08:40:00+00', 'evidence-refunded-v1',
    'human-review', clock_timestamp(), clock_timestamp() + interval '15 minutes', null
);
insert into public.billing_entitlements (
    stripe_checkout_session_id, stripe_payment_intent_id, stripe_subscription_id,
    stripe_customer_id, origin_user_id, owner_user_id, plan, status,
    checkout_email_hmac, checkout_email_hmac_key_version, stripe_created_at
) values (
    'cs_reconciliation_refunded_1', 'pi_reconciliation_refunded_1', null,
    'cus_reconciliation_refunded_1', '00000000-0000-0000-0000-0000000000e5',
    '00000000-0000-0000-0000-0000000000e5', 'lifetime', 'refunded',
    'hmac-reconciliation-refunded', 1, timestamptz '2026-08-04 00:00:00+00'
);
select public.seal_historical_entitlement_reconciliation(
    '20000000-0000-0000-0000-000000000003'
);
do $$
begin
    begin
        perform public.import_approved_historical_entitlement(
            '20000000-0000-0000-0000-000000000003',
            'cs_reconciliation_refunded_1'
        );
        raise exception 'refunded reconciliation identity unexpectedly imported';
    exception when others then
        if sqlerrm <> 'Historical reconciliation lifecycle conflict' then
            raise;
        end if;
    end;
end $$;

rollback;
