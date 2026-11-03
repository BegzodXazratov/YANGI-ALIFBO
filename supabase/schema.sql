create table if not exists public.users (
  telegram_id bigint primary key,
  username text,
  telegram_first_name text,
  telegram_last_name text,
  display_name text,
  phone_number text,
  registration_step text check (registration_step in ('name','phone')),
  chat_id bigint not null,
  preferred_direction text check (preferred_direction in ('latin_to_cyrillic','cyrillic_to_latin','latin_to_new','new_to_latin','cyrillic_to_new','new_to_cyrillic')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Safe migration for an earlier draft schema, if it was already installed.
alter table public.users add column if not exists telegram_first_name text;
alter table public.users add column if not exists telegram_last_name text;
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists phone_number text;
alter table public.users add column if not exists registration_step text;
alter table public.users drop column if exists content_consent;

-- Delete any old content-bearing logs from the previous prototype.
drop table if exists public.message_logs;

-- Metadata-only usage events. No message body, document name, or file content is stored.
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  telegram_id bigint not null references public.users(telegram_id) on delete cascade,
  input_type text not null check (input_type in ('text','txt','docx','pdf')),
  direction text not null check (direction in ('latin_to_cyrillic','cyrillic_to_latin','latin_to_new','new_to_latin','cyrillic_to_new','new_to_cyrillic')),
  created_at timestamptz not null default now()
);
create index if not exists users_last_seen_idx on public.users(last_seen_at desc);
create index if not exists usage_events_created_idx on public.usage_events(created_at desc);
create index if not exists usage_events_user_idx on public.usage_events(telegram_id);

alter table public.users enable row level security;
alter table public.usage_events enable row level security;
-- The app accesses Supabase with the service-role key on the server only.
