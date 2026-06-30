-- Strategy table (single row per user, JSONB data)
create table public.strategy (
    user_id     uuid primary key references auth.users(id) on delete cascade,
    data        jsonb not null default '{}',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table public.strategy enable row level security;

create policy "Users can view own strategy" on public.strategy
    for select using (auth.uid() = user_id);
create policy "Users can upsert own strategy" on public.strategy
    for insert with check (auth.uid() = user_id);
create policy "Users can update own strategy" on public.strategy
    for update using (auth.uid() = user_id);
create policy "Users can delete own strategy" on public.strategy
    for delete using (auth.uid() = user_id);
