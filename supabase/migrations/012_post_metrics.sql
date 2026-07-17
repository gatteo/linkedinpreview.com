-- Post performance metrics (Wave 5 - Analytics). One row per draft holding the
-- latest engagement snapshot for a post that was published to LinkedIn. Values
-- arrive three ways (see `source`): the member types them in by hand, a LinkedIn
-- native CSV export is imported, or the analytics sync cron pulls them from the
-- memberCreatorPostAnalytics API. Whichever source last wrote a row wins (upsert
-- on draft_id), so the table always reflects the most recent known numbers.
--
-- The columns mirror what LinkedIn's memberCreatorPostAnalytics API exposes
-- (IMPRESSION, MEMBERS_REACHED, REACTION, COMMENT, RESHARE, POST_SAVE, POST_SEND,
-- LINK_CLICKS, FOLLOWER_GAINED_FROM_CONTENT, PROFILE_VIEW_FROM_CONTENT) so an
-- API sync can populate every field. Manual / CSV entry typically fills only the
-- headline few; the rest stay null ("unknown" rather than zero).
create table public.post_metrics (
    draft_id      text primary key references public.drafts(id) on delete cascade,
    user_id       uuid not null references auth.users(id) on delete cascade,
    -- Reach
    impressions   int,
    reach         int, -- unique members reached
    -- Engagement
    reactions     int,
    comments      int,
    reshares      int,
    saves         int,
    sends         int,
    link_clicks   int,
    -- Growth attributed to the post
    follows       int, -- followers gained from this post
    profile_views int, -- profile views from this post
    -- Where these numbers came from
    source        text not null default 'manual' check (source in ('manual', 'csv', 'linkedin_api')),
    -- When the numbers were last refreshed from their source
    measured_at   timestamptz not null default now(),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index idx_post_metrics_user on public.post_metrics(user_id);

alter table public.post_metrics enable row level security;

-- Owners manage their own metrics. The analytics sync cron uses the service-role
-- key, which bypasses RLS.
create policy "Users can view own post metrics" on public.post_metrics
    for select using (auth.uid() = user_id);
create policy "Users can insert own post metrics" on public.post_metrics
    for insert with check (auth.uid() = user_id);
create policy "Users can update own post metrics" on public.post_metrics
    for update using (auth.uid() = user_id);
create policy "Users can delete own post metrics" on public.post_metrics
    for delete using (auth.uid() = user_id);
