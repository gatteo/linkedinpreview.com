-- Onboarding v2 addendum: keep the COMPLETE raw provider payloads (Scrapingdog
-- fast profile, Bright Data snapshot record) so nothing from the paid API calls
-- is lost for later analysis or reuse. The trimmed columns stay the working set.
alter table public.onboarding_sessions
    add column fast_raw jsonb,
    add column rich_raw jsonb;
