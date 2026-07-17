-- Which source produced the persisted rich_posts corpus: 'brightdata' (posts or
-- profile dataset), 'scrapingdog' (gated-profile activity fallback mined from
-- fast_raw), or 'none' (no authored posts found). Lets us tell a gated profile
-- that was rescued via the fallback apart from a genuinely postless one.
alter table public.onboarding_sessions add column if not exists posts_source text;
