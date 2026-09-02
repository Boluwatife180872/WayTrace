-- ============================================
-- WayTrace: enable realtime on `deliveries`
-- Required so the Tracking screen gets live row updates
-- without a manual refetch (Phase 4).
-- Run once in Supabase SQL Editor.
-- ============================================

alter publication supabase_realtime add table public.deliveries;