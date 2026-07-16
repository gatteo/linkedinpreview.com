-- Second Bright Data snapshot per onboarding session: the LinkedIn POSTS
-- dataset (discover-by-profile-URL) carries full post text, dates, and
-- engagement counts - far richer analysis corpus than the profile dataset's
-- truncated activity previews. Triggered alongside the profile snapshot;
-- posts_raw archives the complete provider records, verbatim.
alter table public.onboarding_sessions
    add column posts_snapshot_id text,
    add column posts_raw jsonb;
