-- Allow 'insights' as a valid ai_usage action (Wave 5 analytics AI coach).
alter table public.ai_usage drop constraint ai_usage_action_check;
alter table public.ai_usage add constraint ai_usage_action_check
    check (action in ('generation', 'refinement', 'analysis', 'wizard', 'quickAction', 'ideas', 'insights'));
