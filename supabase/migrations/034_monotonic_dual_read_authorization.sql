-- Transitional caller-bound authorization. An active immutable ledger entitlement
-- or a paid legacy projection grants access until the complete historical
-- reconciliation seals any identity-matched revocation.

create or replace function public.current_authorized_entitlement()
returns table (
    plan text,
    stripe_customer_id text,
    stripe_subscription_id text
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
    with candidates as (
        select
            e.plan,
            e.stripe_customer_id,
            e.stripe_subscription_id,
            0 as source_rank,
            e.created_at as source_created_at,
            e.id::text as source_id
        from public.billing_entitlements e
        where e.owner_user_id = auth.uid()
          and e.status = 'active'

        union all

        select
            b.plan,
            b.stripe_customer_id,
            b.stripe_subscription_id,
            1 as source_rank,
            b.updated_at as source_created_at,
            b.user_id::text as source_id
        from public.billing b
        where b.user_id = auth.uid()
          and b.plan in ('pro', 'lifetime')
          and not exists (
              select 1
              from public.billing_entitlements e
              where e.origin_user_id = b.user_id
                and e.status <> 'active'
                and e.plan = b.plan
                and b.stripe_subscription_id is not null
                and e.stripe_subscription_id = b.stripe_subscription_id
          )
    ), selected as (
        select c.plan, c.stripe_customer_id, c.stripe_subscription_id
        from candidates c
        order by
            case c.plan when 'lifetime' then 0 else 1 end,
            c.source_rank,
            c.source_created_at asc,
            c.source_id asc
        limit 1
    )
    select
        coalesce((select selected.plan from selected), 'free')::text,
        (select selected.stripe_customer_id from selected),
        (select selected.stripe_subscription_id from selected);
$$;

revoke all on function public.current_authorized_entitlement() from public, anon, authenticated, service_role;
grant execute on function public.current_authorized_entitlement() to authenticated;
