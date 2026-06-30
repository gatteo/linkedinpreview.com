-- Drafts table
create table public.drafts (
    id          text primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    title       text not null default 'Untitled',
    content     jsonb,
    media       jsonb,
    status      text not null default 'draft'
                check (status in ('draft', 'scheduled', 'published')),
    word_count  int not null default 0,
    char_count  int not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index idx_drafts_user on public.drafts(user_id, updated_at desc);
alter table public.drafts enable row level security;

create policy "Users can view own drafts" on public.drafts
    for select using (auth.uid() = user_id);
create policy "Users can insert own drafts" on public.drafts
    for insert with check (auth.uid() = user_id);
create policy "Users can update own drafts" on public.drafts
    for update using (auth.uid() = user_id);
create policy "Users can delete own drafts" on public.drafts
    for delete using (auth.uid() = user_id);

-- Branding table (single row per user)
create table public.branding (
    user_id     uuid primary key references auth.users(id) on delete cascade,
    data        jsonb not null default '{}',
    updated_at  timestamptz not null default now()
);

alter table public.branding enable row level security;

create policy "Users can view own branding" on public.branding
    for select using (auth.uid() = user_id);
create policy "Users can upsert own branding" on public.branding
    for insert with check (auth.uid() = user_id);
create policy "Users can update own branding" on public.branding
    for update using (auth.uid() = user_id);
