-- LinkedIn OAuth connections (Wave 4). One row per user. The access_token is
-- AES-256-GCM ciphertext (encrypted in the app layer with LINKEDIN_TOKEN_ENC_KEY)
-- so a leaked row is useless without the server-only key.
create table public.linkedin_connections (
    user_id       uuid primary key references auth.users(id) on delete cascade,
    linkedin_sub  text not null,
    name          text,
    picture_url   text,
    scope         text,
    access_token  text not null,
    expires_at    timestamptz not null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

alter table public.linkedin_connections enable row level security;

-- Owners manage their own connection. The token column is ciphertext, so even
-- read access does not expose a usable token. The cron publisher uses the
-- service-role key, which bypasses RLS.
create policy "Users can view own linkedin connection" on public.linkedin_connections
    for select using (auth.uid() = user_id);
create policy "Users can insert own linkedin connection" on public.linkedin_connections
    for insert with check (auth.uid() = user_id);
create policy "Users can update own linkedin connection" on public.linkedin_connections
    for update using (auth.uid() = user_id);
create policy "Users can delete own linkedin connection" on public.linkedin_connections
    for delete using (auth.uid() = user_id);
