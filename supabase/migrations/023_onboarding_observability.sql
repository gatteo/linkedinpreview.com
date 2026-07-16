-- Onboarding observability: agent-facing aggregate views over
-- onboarding_sessions (+ billing for the paid truth), so the monitoring
-- routines can pull funnel numbers with cheap SQL instead of raw jsonb rows.
--
-- Both views are service-role only: they expose cross-user aggregates and the
-- session rows are RLS-scoped to their owners. No raw provider payloads and no
-- free-text answers (name, clarification, post text) are exposed - only enum
-- labels, counts, flags, and timestamps.

-- Per-session detail: one row per onboarding run, PII-free. resume_at is the
-- step the user last persisted on ('done' = finished), which makes it the
-- drop-off marker for sessions that never completed.
create view public.onboarding_drop_detail
with (security_invoker = true) as
select
    s.user_id,
    s.started_at,
    s.updated_at,
    s.completed_at,
    s.resume_at,
    s.converted,
    s.profile_url is not null                                   as has_profile_url,
    s.fast_source,
    s.rich_status,
    s.rich_triggered_at,
    s.insights_kind,
    (
        select count(*)
        from jsonb_array_elements(coalesce(s.rich_posts, '[]'::jsonb)) p
        where p ->> 'origin' = 'post'
    )                                                           as authored_posts,
    s.answers ->> 'primaryGoal'                                 as primary_goal,
    s.answers ->> 'role'                                        as role,
    nullif(s.answers ->> 'niche', '') is not null               as has_niche,
    case
        when jsonb_typeof(s.answers -> 'topics') = 'array'
        then jsonb_array_length(s.answers -> 'topics')
        else 0
    end                                                         as topics_count,
    case
        when s.answers ->> 'frequency' ~ '^[0-9]+(\.[0-9]+)?$'
        then (s.answers ->> 'frequency')::numeric
    end                                                         as frequency,
    coalesce(s.answers -> 'linkedinConnected' = 'true'::jsonb, false) as linkedin_connected,
    s.answers ->> 'startCommitment'                             as commitment,
    case
        when jsonb_typeof(s.answers -> 'postIdeas') = 'array'
        then jsonb_array_length(s.answers -> 'postIdeas')
        else 0
    end                                                         as post_ideas_count,
    s.answers ->> 'firstPostText' is not null                   as has_first_post,
    b.plan                                                      as billing_plan,
    extract(epoch from (s.updated_at - s.started_at))::int      as session_seconds
from public.onboarding_sessions s
left join public.billing b on b.user_id = s.user_id;

-- Daily rollup: the shape of the funnel per calendar day (UTC), one query for
-- the health-check routine's "is today off-baseline" comparison.
create view public.onboarding_funnel_daily
with (security_invoker = true) as
select
    date_trunc('day', s.started_at)::date                                        as day,
    count(*)                                                                     as starts,
    count(*) filter (where s.profile_url is not null)                            as with_profile_url,
    count(*) filter (where s.completed_at is not null)                           as completed,
    count(*) filter (where s.converted is true)                                  as converted_client,
    count(*) filter (where b.plan in ('pro', 'lifetime'))                        as paid,
    count(*) filter (where s.rich_status = 'ready')                              as rich_ready,
    count(*) filter (where s.rich_status = 'empty')                              as rich_empty,
    count(*) filter (where s.rich_status = 'failed')                             as rich_failed,
    count(*) filter (where s.rich_status = 'unavailable')                        as rich_unavailable,
    count(*) filter (where s.rich_status = 'pending')                            as rich_pending,
    count(*) filter (where s.insights_kind = 'posts')                            as insights_posts,
    count(*) filter (where s.insights_kind = 'profile')                          as insights_profile,
    count(*) filter (where s.insights_kind is null and s.completed_at is not null) as insights_none,
    count(*) filter (where s.fast_source = 'scrapingdog')                        as fast_scrapingdog,
    count(*) filter (where s.fast_source = 'jsonld')                             as fast_jsonld,
    count(*) filter (where s.fast_source = 'oauth')                              as fast_oauth,
    count(*) filter (where s.fast_source = 'none')                               as fast_none
from public.onboarding_sessions s
left join public.billing b on b.user_id = s.user_id
group by 1;

-- Supabase grants anon/authenticated on new public objects by default; these
-- views aggregate across users, so only the service role may read them.
revoke all on public.onboarding_drop_detail from anon, authenticated;
revoke all on public.onboarding_funnel_daily from anon, authenticated;
grant select on public.onboarding_drop_detail to service_role;
grant select on public.onboarding_funnel_daily to service_role;

create index if not exists onboarding_sessions_started_at_idx
    on public.onboarding_sessions (started_at);
