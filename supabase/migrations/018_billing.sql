-- Billing / plan state (single row per user).
--
-- Written ONLY by the Stripe webhook via the service-role client (which bypasses
-- RLS). Clients can read their own row to reflect plan state in the UI. There are
-- deliberately NO user insert/update/delete policies: plan changes are the source
-- of truth from Stripe, never client-set. See docs/MONETIZATION.md and
-- docs/onboarding-conversion-redesign.md (§7, §12).

create table public.billing (
    user_id                 uuid primary key references auth.users(id) on delete cascade,
    plan                    text not null default 'free' check (plan in ('free', 'pro', 'lifetime')),
    plan_source             text,
    plan_renews_at          timestamptz,
    stripe_customer_id      text,
    stripe_subscription_id  text,
    updated_at              timestamptz not null default now()
);

create index idx_billing_customer on public.billing(stripe_customer_id);

alter table public.billing enable row level security;

create policy "Users can view own billing" on public.billing
    for select using (auth.uid() = user_id);
