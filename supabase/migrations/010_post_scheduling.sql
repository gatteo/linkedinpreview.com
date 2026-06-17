-- Post scheduling & publishing (Wave 4). Extends drafts with the data the cron
-- publisher needs and adds a 'failed' lifecycle state for posts that could not be
-- delivered to LinkedIn.

alter table public.drafts add column if not exists scheduled_at      timestamptz;
alter table public.drafts add column if not exists published_at      timestamptz;
alter table public.drafts add column if not exists linkedin_post_urn text;
alter table public.drafts add column if not exists linkedin_post_url text;
alter table public.drafts add column if not exists publish_error     text;
alter table public.drafts add column if not exists publish_attempts  int not null default 0;
alter table public.drafts add column if not exists publish_lock_at   timestamptz;

-- Allow the 'failed' status (system-set when delivery permanently fails).
alter table public.drafts drop constraint if exists drafts_status_check;
alter table public.drafts add constraint drafts_status_check
    check (status in ('draft', 'scheduled', 'published', 'failed'));

-- Index the cron's "due and not yet published" query.
create index if not exists idx_drafts_due
    on public.drafts (scheduled_at)
    where status = 'scheduled' and linkedin_post_urn is null;

-- Atomically claim due scheduled posts for publishing. A 10-minute lock window
-- prevents concurrent or rapid-retry double-publishing while still allowing a
-- failed attempt to be retried later. Runs as service-role only (cron publisher).
create or replace function public.claim_due_linkedin_posts(p_limit int)
returns table (
    id               text,
    user_id          uuid,
    content          jsonb,
    media            jsonb,
    publish_attempts int
)
language plpgsql security definer set search_path = public as $$
begin
    return query
    update drafts d
    set publish_lock_at = now(),
        publish_attempts = d.publish_attempts + 1
    from (
        select s.id
        from drafts s
        where s.status = 'scheduled'
          and s.scheduled_at is not null
          and s.scheduled_at <= now()
          and s.linkedin_post_urn is null
          and (s.publish_lock_at is null or s.publish_lock_at < now() - interval '10 minutes')
        order by s.scheduled_at asc
        limit p_limit
        for update skip locked
    ) sel
    where d.id = sel.id
    returning d.id, d.user_id, d.content, d.media, d.publish_attempts;
end; $$;

revoke all on function public.claim_due_linkedin_posts(int) from public, anon, authenticated;
grant execute on function public.claim_due_linkedin_posts(int) to service_role;

-- Atomically claim a single draft for a manual "Publish now" so it cannot be
-- double-published by the cron (or a second click). Returns true only if this
-- caller won the claim. Runs as the owning member (auth.uid() guard).
create or replace function public.claim_draft_for_publish(p_id text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_claimed boolean;
begin
    update drafts
    set publish_lock_at = now()
    where id = p_id
      and user_id = auth.uid()
      and linkedin_post_urn is null
      and (publish_lock_at is null or publish_lock_at < now() - interval '10 minutes')
    returning true into v_claimed;
    return coalesce(v_claimed, false);
end; $$;

grant execute on function public.claim_draft_for_publish(text) to authenticated;
