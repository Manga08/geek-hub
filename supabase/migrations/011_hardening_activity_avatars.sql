-- ===========================================
-- GEEK-HUB: Hardening Activity (Idempotent)
-- Migration 011 - Backfill FK for profiles
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- =========================
-- 1. Backfill: Ensure profiles exist for all activity_events actors
-- =========================
-- This prevents FK violations if activity_events has actors without profiles
INSERT INTO public.profiles (id)
SELECT DISTINCT actor_id
FROM public.activity_events
WHERE actor_id IS NOT NULL
  AND actor_id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 2. Notify PostgREST to reload schema
-- =========================
NOTIFY pgrst, 'reload schema';

-- ===========================================
-- STORAGE POLICIES (Configure via Dashboard)
-- ===========================================
-- Las políticas de storage.objects NO se pueden crear via SQL
-- porque requieren ser owner de la tabla (solo Supabase internamente).
--
-- Ir a: Supabase Dashboard → Storage → avatars bucket → Policies
--
-- Crear las siguientes políticas manualmente:
--
-- 1. SELECT Policy (avatars_select_policy):
--    - Allowed operation: SELECT
--    - Target roles: authenticated
--    - USING expression:
--      bucket_id = 'avatars'
--
-- 2. INSERT Policy (avatars_insert_policy):
--    - Allowed operation: INSERT
--    - Target roles: authenticated
--    - WITH CHECK expression:
--      bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 3. UPDATE Policy (avatars_update_policy):
--    - Allowed operation: UPDATE
--    - Target roles: authenticated
--    - USING expression:
--      bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
--    - WITH CHECK expression:
--      bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 4. DELETE Policy (avatars_delete_policy):
--    - Allowed operation: DELETE
--    - Target roles: authenticated
--    - USING expression:
--      bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
-- ===========================================
