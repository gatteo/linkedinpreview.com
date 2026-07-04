-- Onboarding v2: server-side session record for the personalized onboarding.
-- One row per user (anonymous auth). Captures the two-tier LinkedIn profile
-- fetch (fast sync lookup + Bright Data async snapshot), the LLM enrichment and
-- insights payloads, and every answer, so user types can be analyzed later.
create table public.onboarding_sessions (
    user_id           uuid primary key references auth.users(id) on delete cascade,
    profile_url       text,
    fast_source       text check (fast_source in ('scrapingdog', 'jsonld', 'oauth', 'none')),
    fast_profile      jsonb,
    rich_snapshot_id  text,
    rich_status       text not null default 'idle'
                      check (rich_status in ('idle', 'pending', 'ready', 'empty', 'failed', 'unavailable')),
    rich_triggered_at timestamptz,
    rich_profile      jsonb,
    rich_posts        jsonb,
    enrichment        jsonb,
    insights          jsonb,
    insights_kind     text check (insights_kind in ('posts', 'profile', 'benchmark')),
    answers           jsonb not null default '{}'::jsonb,
    resume_at         text,
    started_at        timestamptz not null default now(),
    completed_at      timestamptz,
    converted         boolean,
    updated_at        timestamptz not null default now()
);

alter table public.onboarding_sessions enable row level security;

create policy "Users can view own onboarding session" on public.onboarding_sessions
    for select using (auth.uid() = user_id);
create policy "Users can insert own onboarding session" on public.onboarding_sessions
    for insert with check (auth.uid() = user_id);
create policy "Users can update own onboarding session" on public.onboarding_sessions
    for update using (auth.uid() = user_id);
-- No delete policy: the session row is the analytics record of the onboarding.

-- New onboarding AI bucket: insights generation over the scraped posts.
alter table public.ai_usage drop constraint ai_usage_action_check;
alter table public.ai_usage add constraint ai_usage_action_check
    check (action in (
        'generation', 'refinement', 'analysis', 'suggestions', 'wizard', 'quickAction',
        'ideas', 'insights', 'import', 'carouselGenerate', 'onbEnrich', 'onbFirstPost',
        'onbInsights'
    ));
