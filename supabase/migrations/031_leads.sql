create table public.leads (
    id uuid primary key default gen_random_uuid(),
    email_normalized text not null unique check (email_normalized = lower(trim(email_normalized))),
    user_id uuid not null references auth.users(id) on delete cascade,
    consented_at timestamptz not null,
    consent_version text not null,
    source text not null check (source = 'free_tool_post_copy'),
    created_at timestamptz not null default now()
);

create table public.lead_capture_attempts (
    id bigint generated always as identity primary key,
    ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default clock_timestamp()
);

create index leads_created_at_idx on public.leads (created_at desc);
create index lead_capture_attempts_ip_hash_created_at_idx on public.lead_capture_attempts (ip_hash, created_at desc);

alter table public.leads enable row level security;
alter table public.lead_capture_attempts enable row level security;
revoke all on table public.leads from anon, authenticated;
revoke all on table public.lead_capture_attempts from anon, authenticated;

create function public.capture_consent_lead(
    p_email_normalized text,
    p_user_id uuid,
    p_ip_hash text,
    p_consented_at timestamptz,
    p_consent_version text,
    p_source text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    attempts integer;
begin
    if p_email_normalized <> lower(trim(p_email_normalized))
        or char_length(p_email_normalized) > 254
        or p_email_normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        or p_source <> 'free_tool_post_copy'
        or p_consented_at is null
        or p_consent_version is null
        or p_ip_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'invalid lead capture input';
    end if;

    perform pg_advisory_xact_lock(hashtextextended('lead_capture:' || p_ip_hash, 0));

    select count(*)
    into attempts
    from public.lead_capture_attempts
    where ip_hash = p_ip_hash
      and created_at > clock_timestamp() - interval '24 hours';

    if attempts >= 5 then
        return 'rate_limited';
    end if;

    insert into public.lead_capture_attempts (ip_hash, user_id)
    values (p_ip_hash, p_user_id);

    insert into public.leads (email_normalized, user_id, consented_at, consent_version, source)
    values (p_email_normalized, p_user_id, p_consented_at, p_consent_version, p_source)
    on conflict (email_normalized) do nothing;

    if found then
        return 'created';
    end if;

    return 'duplicate';
end;
$$;

revoke execute on function public.capture_consent_lead(text, uuid, text, timestamptz, text, text) from public;
revoke execute on function public.capture_consent_lead(text, uuid, text, timestamptz, text, text) from anon, authenticated;
grant execute on function public.capture_consent_lead(text, uuid, text, timestamptz, text, text) to service_role;
