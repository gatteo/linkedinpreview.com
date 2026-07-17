-- Allow new action types for wizard and quick AI actions
alter table public.ai_usage drop constraint ai_usage_action_check;
alter table public.ai_usage add constraint ai_usage_action_check
    check (action in ('generation', 'refinement', 'analysis', 'wizard', 'quickAction'));
