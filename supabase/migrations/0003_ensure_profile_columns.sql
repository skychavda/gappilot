-- ============================================================
-- GapPilot — Ensure all profile columns exist
-- Safe to run even if columns already exist.
-- ============================================================

alter table public.profiles
  add column if not exists full_name               text,
  add column if not exists company_name            text,
  add column if not exists avatar_url              text,
  add column if not exists stripe_customer_id      text,
  add column if not exists stripe_subscription_id  text,
  add column if not exists subscription_tier       text,
  add column if not exists subscription_status     text,
  add column if not exists trial_ends_at           timestamptz,
  add column if not exists calls_used_this_month   integer not null default 0,
  add column if not exists onboarding_completed    boolean not null default false,
  add column if not exists credits_balance         integer;

-- Unique index on stripe_customer_id (skip if already exists)
create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Drop all existing check constraints on subscription_tier and subscription_status
do $$
declare
  r record;
begin
  for r in
    select distinct con.conname
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    where ns.nspname = 'public'
      and cls.relname = 'profiles'
      and con.contype = 'c'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', r.conname);
  end loop;
end
$$;

-- Re-add check constraints with correct values
alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('starter', 'solo', 'growth', 'agency'));

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('trialing', 'active', 'canceled', 'past_due'));

-- ============================================================
-- Update trigger to default new users to starter plan
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name,
    subscription_tier, subscription_status,
    trial_ends_at, credits_balance
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    'starter',
    'active',
    null,
    15
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
