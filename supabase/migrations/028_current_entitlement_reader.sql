-- Caller-bound read model for paid authorization.
-- `billing` remains a mutable UI projection during the transition but must not
-- decide whether a user can consume paid product capacity.

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
    with selected as (
        select e.plan, e.stripe_customer_id, e.stripe_subscription_id
        from public.billing_entitlements e
        where e.owner_user_id = auth.uid()
          and e.status = 'active'
        order by
            case e.plan when 'lifetime' then 0 else 1 end,
            e.created_at asc,
            e.id asc
        limit 1
    )
    select
        coalesce((select selected.plan from selected), 'free')::text,
        (select selected.stripe_customer_id from selected),
        (select selected.stripe_subscription_id from selected);
$$;

revoke all on function public.current_authorized_entitlement() from public, anon, authenticated, service_role;
grant execute on function public.current_authorized_entitlement() to authenticated;
