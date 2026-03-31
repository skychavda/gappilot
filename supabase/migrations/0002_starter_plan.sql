-- ============================================================
-- GapPilot — Starter plan & credits system
-- ============================================================

-- Drop ALL check constraints on subscription_tier (name varies by Postgres version)
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid
    where ns.nspname = 'public'
      and cls.relname = 'profiles'
      and con.contype = 'c'
      and att.attname = 'subscription_tier'
      and att.attnum = any(con.conkey)
  loop
    execute format('alter table public.profiles drop constraint if exists %I', r.conname);
  end loop;
end
$$;

-- Re-add constraint with 'starter' included
alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('starter', 'solo', 'growth', 'agency'));

-- Add credits_balance column (null = not on credits-based plan)
alter table public.profiles
  add column if not exists credits_balance integer;

-- ============================================================
-- CREDIT PURCHASES — audit log
-- ============================================================
create table if not exists public.credit_purchases (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  credits           integer not null,
  amount_cents      integer not null,
  stripe_session_id text unique,
  package_key       text not null
);

alter table public.credit_purchases enable row level security;

create policy "credit_purchases: owner read"
  on public.credit_purchases for select
  using (auth.uid() = profile_id);

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
