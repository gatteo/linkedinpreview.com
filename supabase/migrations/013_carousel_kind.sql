-- Carousel support (Wave 3). Carousels are stored in the same `drafts` table as
-- text posts: the CarouselDocument JSON lives in the existing `content` jsonb
-- column and is discriminated by this `kind` column. Existing rows default to
-- 'post' so nothing changes for them; the whole CRUD / duplicate / schedule /
-- publish surface and the sidebar/table UI work unchanged for both kinds.

alter table public.drafts add column if not exists kind text not null default 'post'
    check (kind in ('post', 'carousel'));

-- The dashboard lists posts and carousels in separate surfaces, so index the
-- per-user, per-kind, most-recent-first query both views run.
create index if not exists idx_drafts_user_kind
    on public.drafts (user_id, kind, updated_at desc);
