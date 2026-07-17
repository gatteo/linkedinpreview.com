-- LinkedIn analytics connections (Wave 5). A SEPARATE OAuth token from the
-- analytics app (App B / Community Management API), kept apart from the
-- publishing connection (linkedin_connections, App A) because LinkedIn requires
-- the Community Management API to be the only product on its app. One row per
-- user; access_token is AES-256-GCM ciphertext (LINKEDIN_TOKEN_ENC_KEY), so a
-- leaked row is useless without the server-only key. The member's person URN is
-- not stored here - it is reused from linkedin_connections (same member).
create table public.linkedin_analytics_connections (
    user_id      uuid primary key references auth.users(id) on delete cascade,
    access_token text not null,
    scope        text,
    expires_at   timestamptz not null,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

alter table public.linkedin_analytics_connections enable row level security;

-- Owners manage their own connection. The token column is ciphertext, so read
-- access alone does not expose a usable token. The analytics sync cron uses the
-- service-role key, which bypasses RLS.
create policy "Users can view own analytics connection" on public.linkedin_analytics_connections
    for select using (auth.uid() = user_id);
create policy "Users can insert own analytics connection" on public.linkedin_analytics_connections
    for insert with check (auth.uid() = user_id);
create policy "Users can update own analytics connection" on public.linkedin_analytics_connections
    for update using (auth.uid() = user_id);
create policy "Users can delete own analytics connection" on public.linkedin_analytics_connections
    for delete using (auth.uid() = user_id);
