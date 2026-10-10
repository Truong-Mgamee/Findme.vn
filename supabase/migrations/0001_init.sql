-- Daily Fate – initial schema (see docs/plan/04-B3-backend-design.md §4)
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  full_name text,
  locale text not null default 'en',
  gender text check (gender in ('male','female','other')),
  birth_date date not null,
  birth_time time,
  birth_time_precision text not null default 'exact' check (birth_time_precision in ('exact','canh_gio','unknown')),
  birth_place_id int,
  birth_lat double precision,
  birth_lng double precision,
  birth_tz text,
  birth_utc_offset_hours numeric(4,2),
  is_lunar_input boolean not null default false,
  default_system text not null default 'astro' check (default_system in ('tuvi','bazi','astro','numerology')),
  daily_push_hour smallint default 8,
  daily_push_minute smallint default 0,
  push_token text,
  push_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  label text not null,
  relation text,
  gender text,
  birth_date date not null,
  birth_time time,
  birth_time_precision text default 'unknown',
  birth_lat double precision,
  birth_lng double precision,
  birth_tz text,
  birth_utc_offset_hours numeric(4,2),
  created_at timestamptz default now()
);

create table if not exists entitlements (
  user_id uuid primary key references profiles on delete cascade,
  tier text not null default 'free' check (tier in ('free','plus')),
  product_id text,
  store text,
  expires_at timestamptz,
  is_trial boolean default false,
  will_renew boolean,
  rc_app_user_id text,
  last_event_id text,
  updated_at timestamptz default now()
);

create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind text not null,
  system text,
  subject_people_ids uuid[],
  input_hash text not null,
  result jsonb not null,
  pdf_path text,
  paid_via text,
  created_at timestamptz default now()
);
create index if not exists readings_user_idx on readings (user_id, created_at desc);

create table if not exists daily_logs (
  user_id uuid not null references profiles on delete cascade,
  day date not null,
  opened_at timestamptz,
  shared boolean default false,
  tarot_card text,
  score jsonb,
  primary key (user_id, day)
);

create table if not exists streaks (
  user_id uuid primary key references profiles on delete cascade,
  current int default 0,
  longest int default 0,
  last_day date
);

create table if not exists content_packs (
  locale text not null,
  version int not null,
  storage_path text not null,
  checksum text not null,
  published_at timestamptz default now(),
  primary key (locale, version)
);

create table if not exists ask_messages (
  id bigserial primary key,
  user_id uuid not null references profiles on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  tokens int,
  created_at timestamptz default now()
);

-- Row level security: owner-only on user tables, public read on content packs
alter table profiles enable row level security;
alter table people enable row level security;
alter table entitlements enable row level security;
alter table readings enable row level security;
alter table daily_logs enable row level security;
alter table streaks enable row level security;
alter table content_packs enable row level security;
alter table ask_messages enable row level security;

create policy "profiles owner" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "people owner" on people for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "entitlements read own" on entitlements for select using (auth.uid() = user_id);
create policy "readings owner" on readings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs owner" on daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "streaks owner" on streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "content_packs public read" on content_packs for select using (true);
create policy "ask owner" on ask_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- account deletion (GDPR / Nghị định 13/2023)
create or replace function delete_user() returns void language plpgsql security definer as $$
begin
  delete from auth.users where id = auth.uid();
end $$;
