-- ============================================
-- WayTrace: Sync existing "profiles" table
-- Your profiles table already has: id, name, email, avatar_url
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure Row Level Security is enabled
alter table public.profiles enable row level security;

-- 2. RLS policies (users manage only their own profile)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. Backfill profile rows for existing auth users.
--    Sets name + email from auth metadata where a row is missing.
insert into public.profiles (id, name, email)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name'
  ),
  u.email
from auth.users u
on conflict (id) do nothing;

-- 4. Auto-create a profile row whenever a new auth user signs up.
--    (Uses name + email columns to match your existing table.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();