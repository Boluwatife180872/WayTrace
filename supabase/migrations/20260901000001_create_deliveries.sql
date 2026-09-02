-- ============================================
-- WayTrace: deliveries + delivery_history RLS policies
-- Your tables already exist with this schema:
--
--   deliveries (
--     id uuid pk default gen_random_uuid(),
--     user_id uuid references profiles(id),
--     status text not null default 'order_placed',
--     driver_name text, driver_avatar_url text,
--     current_lat double precision, current_lng double precision,
--     route jsonb, route_progress int default 0,
--     eta_minutes int, created_at, updated_at
--   )
--
--   delivery_history (
--     id uuid pk default gen_random_uuid(),
--     user_id uuid references profiles(id),
--     order_id text, status text, price numeric,
--     thumbnail_url text, delivered_at timestamptz,
--     route_snapshot jsonb, status_timestamps jsonb
--   )
--
-- This file only enables RLS + row policies, and is safe to run
-- whether or not the tables already exist.
-- ============================================

alter table public.deliveries enable row level security;
alter table public.delivery_history enable row level security;

drop policy if exists "Users can view own deliveries" on public.deliveries;
create policy "Users can view own deliveries"
  on public.deliveries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own deliveries" on public.deliveries;
create policy "Users can update own deliveries"
  on public.deliveries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own deliveries" on public.deliveries;
create policy "Users can insert own deliveries"
  on public.deliveries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own history" on public.delivery_history;
create policy "Users can view own history"
  on public.delivery_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own history" on public.delivery_history;
create policy "Users can insert own history"
  on public.delivery_history for insert
  with check (auth.uid() = user_id);