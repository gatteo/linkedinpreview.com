-- Fix TOCTOU race condition: lock rows before counting to prevent concurrent bypass.
-- Also grant execute permission to anonymous users.
create or replace function public.check_and_record_usage(p_action text, p_limit int)
returns json language plpgsql security definer set search_path = public as $$
declare
    v_count int; v_oldest timestamptz;
begin
    -- Lock the counted rows to prevent concurrent bypass
    perform 1 from ai_usage
    where user_id = auth.uid() and action = p_action
      and created_at > now() - interval '24 hours'
    for update;

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

grant execute on function public.check_and_record_usage(text, int) to authenticated, anon;
