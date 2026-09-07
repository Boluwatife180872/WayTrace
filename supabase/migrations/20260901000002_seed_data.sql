-- ============================================
-- WayTrace: seed sample data
-- Matches your existing tables:
--   deliveries (status, driver_name, driver_avatar_url, current_lat,
--               current_lng, route, route_progress, eta_minutes)
--   delivery_history (order_id, status, price, thumbnail_url,
--               delivered_at, route_snapshot, status_timestamps)
-- Run AFTER the profiles backfill, in Supabase SQL Editor.
-- Idempotent: safe to re-run (fixed ids + on conflict do nothing).
-- ============================================

-- Active delivery for an existing profile user
-- Long, realistic Lagos-area route (~50km): Mowe (Ogun State, north of Lagos)
-- → Ikeja (Murtala Muhammed Int'l Airport) → Lagos Island → Victoria Island
-- → Lekki Phase 1 (east end). 6 waypoints → progress 0/20/40/60/80/100%.
insert into public.deliveries (
  id, user_id, status, driver_name, driver_avatar_url,
  current_lat, current_lng, route, route_progress, eta_minutes
)
select
  '11111111-1111-1111-1111-111111111111',
  p.id,
  'on_the_way',
  'Marcus J.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  6.6980,
  3.3186,
  '[
    {"lat": 6.6980, "lng": 3.3186},
    {"lat": 6.6300, "lng": 3.3820},
    {"lat": 6.5775, "lng": 3.3214},
    {"lat": 6.4531, "lng": 3.3958},
    {"lat": 6.4281, "lng": 3.4215},
    {"lat": 6.4400, "lng": 3.5450}
  ]'::jsonb,
  0,
  28
from public.profiles p
limit 1
on conflict (id) do nothing;

-- History sample 1
insert into public.delivery_history (
  id, user_id, order_id, status, price, thumbnail_url,
  delivered_at, route_snapshot, status_timestamps
)
select
  '22222222-2222-2222-2222-222222222222',
  p.id,
  '#WT-7804',
  'In Transit',
  18.00,
  null,
  now(),
  '[
    {"lat": 37.7849, "lng": -122.4074}
  ]'::jsonb,
  '{"order_placed": "2026-09-01T08:00:00Z", "picked_up": "2026-09-01T09:30:00Z", "on_the_way": "2026-09-01T11:20:00Z"}'::jsonb
from public.profiles p
limit 1
on conflict (id) do nothing;

-- History sample 2
insert into public.delivery_history (
  id, user_id, order_id, status, price, thumbnail_url,
  delivered_at, route_snapshot, status_timestamps
)
select
  '33333333-3333-3333-3333-333333333333',
  p.id,
  '#WT-7712',
  'Delivered',
  24.50,
  null,
  now() - interval '5 days',
  '[
    {"lat": 37.7849, "lng": -122.4074}
  ]'::jsonb,
  '{
    "order_placed": "2026-08-25T10:00:00Z",
    "picked_up": "2026-08-25T13:00:00Z",
    "on_the_way": "2026-08-26T07:00:00Z",
    "delivered": "2026-08-26T14:15:00Z"
  }'::jsonb
from public.profiles p
limit 1
on conflict (id) do nothing;