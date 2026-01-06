-- ===========================================
-- GEEK-HUB: Storage Avatars Policies (Idempotent)
-- Migration 013 - Reproducible storage policies
-- Run this SQL in your Supabase SQL Editor as postgres/owner role
-- ===========================================
-- NOTE: This migration requires owner privileges on storage.objects.
-- If it fails with "must be owner of relation objects", run it from
-- the Supabase SQL Editor which has the necessary permissions.
-- ===========================================

-- =========================
-- 1. Ensure avatars bucket exists (public for URL access)
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 2. Drop existing policies (idempotent)
-- =========================
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

-- Also drop any legacy policy names
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- =========================
-- 3. Create policies (authenticated only - no public enumeration)
-- =========================

-- SELECT: Only authenticated users can read avatars
-- (Public URLs still work because bucket is public, but listing is protected)
CREATE POLICY "avatars_select_policy"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- INSERT: Users can only upload to their own folder (userId/filename)
CREATE POLICY "avatars_insert_policy"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Users can only update files in their own folder
CREATE POLICY "avatars_update_policy"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Users can only delete files in their own folder
CREATE POLICY "avatars_delete_policy"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================
-- 4. Notify PostgREST to reload schema
-- =========================
NOTIFY pgrst, 'reload schema';

-- =========================
-- Done
-- =========================
-- Policies created:
-- - avatars_select_policy: authenticated can SELECT
-- - avatars_insert_policy: authenticated can INSERT to own folder
-- - avatars_update_policy: authenticated can UPDATE own files
-- - avatars_delete_policy: authenticated can DELETE own files
