-- ============================================================
-- GapPilot — Initial Schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  created_at              timestamptz not null default now(),
  email                   text not null,
  full_name               text,
  company_name            text,
  avatar_url              text,
  stripe_customer_id      text unique,
  subscription_tier       text check (subscription_tier in ('solo', 'growth', 'agency')) default 'solo',
  subscription_status     text check (subscription_status in ('trialing', 'active', 'canceled', 'past_due')) default 'trialing',
  trial_ends_at           timestamptz default (now() + interval '14 days'),
  calls_used_this_month   integer not null default 0,
  onboarding_completed    boolean not null default false
);

alter table public.profiles enable row level security;

create policy if not exists "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- PLATFORM CONNECTIONS
-- ============================================================
create table if not exists public.platform_connections (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  platform        text not null check (platform in ('elevenlabs', 'retell', 'vapi', 'bland', 'manual')),
  api_key         text not null,
  webhook_secret  text,
  display_name    text not null,
  is_active       boolean not null default true
);

alter table public.platform_connections enable row level security;

create policy if not exists "platform_connections: owner all"
  on public.platform_connections for all
  using (auth.uid() = profile_id);

-- ============================================================
-- AGENTS
-- ============================================================
create table if not exists public.agents (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  profile_id              uuid not null references public.profiles(id) on delete cascade,
  platform_connection_id  uuid references public.platform_connections(id) on delete set null,
  external_agent_id       text,
  name                    text not null,
  platform                text not null check (platform in ('elevenlabs', 'retell', 'vapi', 'bland', 'manual')),
  is_active               boolean not null default true
);

alter table public.agents enable row level security;

create policy if not exists "agents: owner all"
  on public.agents for all
  using (auth.uid() = profile_id);

-- ============================================================
-- TRANSCRIPTS
-- ============================================================
create table if not exists public.transcripts (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  agent_id          uuid references public.agents(id) on delete set null,
  platform          text not null check (platform in ('elevenlabs', 'retell', 'vapi', 'bland', 'manual')),
  external_call_id  text,
  raw_payload       jsonb not null default '{}',
  normalised_turns  jsonb not null default '[]',
  storage_path      text,
  status            text not null default 'pending'
                    check (status in ('pending', 'processing', 'completed', 'failed')),
  duration_seconds  integer,
  error_message     text,
  gap_count         integer not null default 0,
  processed_at      timestamptz
);

alter table public.transcripts enable row level security;

create policy if not exists "transcripts: owner all"
  on public.transcripts for all
  using (auth.uid() = profile_id);

create index if not exists transcripts_profile_id_created_at_idx on public.transcripts(profile_id, created_at desc);
create index if not exists transcripts_status_idx on public.transcripts(status);

-- ============================================================
-- GAPS
-- ============================================================
create table if not exists public.gaps (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  transcript_id       uuid not null references public.transcripts(id) on delete cascade,
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  topic               text not null,
  customer_question   text not null,
  agent_response      text not null,
  failure_type        text not null
                      check (failure_type in ('unknown_topic', 'incomplete_answer', 'wrong_answer', 'deflection', 'repeated_question')),
  severity            text not null check (severity in ('high', 'medium', 'low')),
  suggested_answer    text not null,
  kb_entry_question   text not null,
  kb_entry_answer     text not null,
  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'skipped')),
  reviewed_at         timestamptz
);

alter table public.gaps enable row level security;

create policy if not exists "gaps: owner all"
  on public.gaps for all
  using (auth.uid() = profile_id);

create index if not exists gaps_profile_id_status_idx on public.gaps(profile_id, status);
create index if not exists gaps_transcript_id_idx on public.gaps(transcript_id);

-- ============================================================
-- KB ENTRIES
-- ============================================================
create table if not exists public.kb_entries (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  gap_id           uuid references public.gaps(id) on delete set null,
  question         text not null,
  answer           text not null,
  topic            text,
  source_platform  text check (source_platform in ('elevenlabs', 'retell', 'vapi', 'bland', 'manual')),
  is_active        boolean not null default true
);

alter table public.kb_entries enable row level security;

create policy if not exists "kb_entries: owner all"
  on public.kb_entries for all
  using (auth.uid() = profile_id);

create index if not exists kb_entries_profile_id_idx on public.kb_entries(profile_id);

-- ============================================================
-- EXPORTS (audit log — non-critical)
-- ============================================================
create table if not exists public.exports (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  format       text not null check (format in ('json', 'csv')),
  row_count    integer,
  filters      jsonb default '{}'
);

alter table public.exports enable row level security;

create policy if not exists "exports: owner read"
  on public.exports for select
  using (auth.uid() = profile_id);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('transcripts', 'transcripts', false)
on conflict (id) do nothing;

create policy if not exists "transcripts bucket: owner read"
  on storage.objects for select
  using (
    bucket_id = 'transcripts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "transcripts bucket: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'transcripts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "transcripts bucket: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'transcripts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- FUNCTION: auto-create profile on auth.users insert
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
