-- Table to track AI feature usage per anonymous user
create table public.ai_usage (
    id         bigint generated always as identity primary key,
    user_id    uuid not null references auth.users(id) on delete cascade,
    action     text not null check (action in ('generation', 'refinement')),
    created_at timestamptz not null default now()
);

create index idx_ai_usage_rate_limit
    on public.ai_usage(user_id, action, created_at desc);

alter table public.ai_usage enable row level security;

create policy "Users can view own usage" on public.ai_usage
    for select using (auth.uid() = user_id);

create policy "Users can insert own usage" on public.ai_usage
    for insert with check (auth.uid() = user_id);

-- Atomic check-and-record RPC: checks current usage count and inserts a new
-- row in a single call, preventing race conditions.
create or replace function public.check_and_record_usage(p_action text, p_limit int)
returns json language plpgsql security definer set search_path = public as $$
declare
    v_count int; v_oldest timestamptz;
begin
    select count(*), min(created_at) into v_count, v_oldest
    from ai_usage
    where user_id = auth.uid() and action = p_action
      and created_at > now() - interval '24 hours';

    if v_count >= p_limit then
        return json_build_object('allowed', false, 'remaining', 0,
            'reset_at', (v_oldest + interval '24 hours')::text);
    end if;

    insert into ai_usage (user_id, action) values (auth.uid(), p_action);
    return json_build_object('allowed', true, 'remaining', p_limit - v_count - 1, 'reset_at', null);
end; $$;
