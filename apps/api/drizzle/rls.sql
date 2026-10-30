-- Row Level Security for Supabase-hosted Postgres.
-- Applied by `src/db/migrate.ts` after the drizzle migrations when the driver is `pg`
-- (skipped on PGlite, which has neither roles nor JWT claims). Idempotent: safe to run on every deploy.
--
-- The API itself connects with a service role that BYPASSES RLS and scopes every query by user_id
-- in code; these policies protect direct PostgREST / Supabase client access (web admin, future
-- client-side reads) so a user can only ever see their own rows.
--
-- Identity resolution: `findme.current_user_id()` maps the Supabase JWT `sub` (auth.uid) to users.id,
-- and also honours `set_config('app.user_id', '<uuid>', true)` for server-side sessions that run
-- with RLS enabled.

create schema if not exists findme;

create or replace function findme.current_user_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(current_setting('app.user_id', true), '')::uuid,
    (select u.id from public.users u
      where u.auth_uid = coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))
      limit 1)
  );
$$;

-- -------- user-owned tables -----------------------------------------------------------------
alter table public.users          enable row level security;
alter table public.profiles       enable row level security;
alter table public.readings       enable row level security;
alter table public.ai_messages    enable row level security;
alter table public.entitlements   enable row level security;
alter table public.credits_ledger enable row level security;
alter table public.streaks        enable row level security;
alter table public.push_tokens    enable row level security;
alter table public.experiments    enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists users_self on public.users;
create policy users_self on public.users
  for all using (id = findme.current_user_id()) with check (id = findme.current_user_id());

drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles
  for all using (user_id = findme.current_user_id()) with check (user_id = findme.current_user_id());

drop policy if exists readings_owner on public.readings;
create policy readings_owner on public.readings
  for all using (user_id = findme.current_user_id()) with check (user_id = findme.current_user_id());

drop policy if exists ai_messages_owner on public.ai_messages;
create policy ai_messages_owner on public.ai_messages
  for all using (user_id = findme.current_user_id()) with check (user_id = findme.current_user_id());

-- billing rows are read-only for the owner; only the service role (webhooks) writes them
drop policy if exists entitlements_owner_read on public.entitlements;
create policy entitlements_owner_read on public.entitlements
  for select using (user_id = findme.current_user_id());

drop policy if exists credits_owner_read on public.credits_ledger;
create policy credits_owner_read on public.credits_ledger
  for select using (user_id = findme.current_user_id());

drop policy if exists streaks_owner on public.streaks;
create policy streaks_owner on public.streaks
  for all using (user_id = findme.current_user_id()) with check (user_id = findme.current_user_id());

drop policy if exists push_tokens_owner on public.push_tokens;
create policy push_tokens_owner on public.push_tokens
  for all using (user_id = findme.current_user_id()) with check (user_id = findme.current_user_id());

drop policy if exists experiments_owner_read on public.experiments;
create policy experiments_owner_read on public.experiments
  for select using (user_id = findme.current_user_id());

-- webhook_events: service role only (no policy ⇒ no access for other roles)

-- -------- public-read content ---------------------------------------------------------------
alter table public.content_atoms enable row level security;
alter table public.glossary      enable row level security;
alter table public.daily_content enable row level security;

drop policy if exists content_atoms_published_read on public.content_atoms;
create policy content_atoms_published_read on public.content_atoms
  for select using (status = 'published');

drop policy if exists glossary_public_read on public.glossary;
create policy glossary_public_read on public.glossary for select using (true);

drop policy if exists daily_content_public_read on public.daily_content;
create policy daily_content_public_read on public.daily_content for select using (true);

-- Supabase: expose read access to the anon/authenticated roles; writes stay with service_role.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema findme to authenticated, anon;
    grant execute on function findme.current_user_id() to authenticated, anon;
    grant select on public.content_atoms, public.glossary, public.daily_content to anon, authenticated;
    grant select, insert, update, delete on public.users, public.profiles, public.readings, public.ai_messages, public.streaks, public.push_tokens to authenticated;
    grant select on public.entitlements, public.credits_ledger, public.experiments to authenticated;
  end if;
end $$;
