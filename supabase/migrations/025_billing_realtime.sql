-- Enable Supabase Realtime for public.billing so a Stripe webhook UPDATE landing
-- after the client-side refresh() poll window reflects in the dashboard without a
-- reload. Guarded so re-running does not error if the table is already published.

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'billing'
    ) then
        alter publication supabase_realtime add table public.billing;
    end if;
end $$;
