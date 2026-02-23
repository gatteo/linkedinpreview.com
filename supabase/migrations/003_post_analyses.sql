-- Allow 'analysis' as a valid action in ai_usage
alter table public.ai_usage drop constraint ai_usage_action_check;
alter table public.ai_usage add constraint ai_usage_action_check
    check (action in ('generation', 'refinement', 'analysis'));

-- Table to store AI-powered post analysis results (analytics only)
create table public.post_analyses (
    id                bigint generated always as identity primary key,
    user_id           uuid not null references auth.users(id) on delete cascade,
    post_text         text not null,
    -- Static metrics (passed from client)
    content_length    int not null,
    line_count        int not null,
    hashtag_count     int not null,
    emoji_count       int not null,
    has_formatting    boolean not null default false,
    has_image         boolean not null default false,
    -- AI-generated scores
    score             int not null,
    hook_score        int not null,
    readability_score int not null,
    cta_score         int not null,
    engagement_score  int not null,
    strengths         text[] not null,
    improvements      text[] not null,
    -- AI-generated classification
    topics            text[] not null,
    sentiment         text not null check (sentiment in ('positive', 'neutral', 'negative')),
    category          text not null check (category in ('thought_leadership', 'storytelling', 'educational', 'promotional', 'engagement', 'personal')),
    tone              text not null check (tone in ('professional', 'casual', 'inspirational')),
    has_hook          boolean not null,
    has_cta           boolean not null,
    hook_quality      text not null check (hook_quality in ('weak', 'moderate', 'strong')),
    created_at        timestamptz not null default now()
);

create index idx_post_analyses_user on public.post_analyses(user_id, created_at desc);

alter table public.post_analyses enable row level security;

create policy "Users can view own analyses" on public.post_analyses
    for select using (auth.uid() = user_id);

create policy "Service can insert analyses" on public.post_analyses
    for insert with check (auth.uid() = user_id);
