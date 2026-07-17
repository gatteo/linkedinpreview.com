-- Allow the onboarding AI buckets (one-time profile enrichment + first-post
-- generation) in ai_usage, and backfill 'carouselGenerate' and 'suggestions'
-- which config/ai.ts already uses but no prior migration had added to the constraint.

alter table public.ai_usage drop constraint ai_usage_action_check;
alter table public.ai_usage add constraint ai_usage_action_check
    check (action in (
        'generation', 'refinement', 'analysis', 'suggestions', 'wizard', 'quickAction',
        'ideas', 'insights', 'import', 'carouselGenerate', 'onbEnrich', 'onbFirstPost'
    ));
