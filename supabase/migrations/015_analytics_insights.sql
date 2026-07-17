-- Cached AI analytics insights (Wave 5). One row per user holds the most recent
-- generated insights payload so the dashboard can show them across devices and
-- sessions (user data belongs in the DB, not localStorage). Regenerating
-- overwrites the row.
create table public.analytics_insights (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    data       jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.analytics_insights enable row level security;

create policy "Users can view own insights" on public.analytics_insights
    for select using (auth.uid() = user_id);
create policy "Users can insert own insights" on public.analytics_insights
    for insert with check (auth.uid() = user_id);
create policy "Users can update own insights" on public.analytics_insights
    for update using (auth.uid() = user_id);
