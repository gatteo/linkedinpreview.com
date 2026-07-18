-- Background insights generation: POST /api/onboarding/insights now claims a
-- run and generates past the response (after()), and the client polls GET for
-- the result - the LLM call no longer races the request's maxDuration. These
-- two columns are the run lock + staleness clock, mirroring the rich-scrape's
-- rich_status / rich_triggered_at pair.
alter table public.onboarding_sessions
    add column insights_status text not null default 'idle'
        check (insights_status in ('idle', 'pending', 'ready', 'failed')),
    add column insights_triggered_at timestamptz;

update public.onboarding_sessions set insights_status = 'ready' where insights is not null;
