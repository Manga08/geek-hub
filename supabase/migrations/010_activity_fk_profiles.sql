-- ===========================================
-- GEEK-HUB: Activity FK Hotfix + Avatars Storage
-- Migration 010 - Fix FK to profiles + Storage bucket
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- =========================
-- 1. HOTFIX: Change FK from auth.users to public.profiles
-- =========================
-- PostgREST requires FK to public schema tables for automatic joins

ALTER TABLE public.activity_events
  DROP CONSTRAINT IF EXISTS activity_events_actor_id_fkey;

ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =========================
-- 2. Storage Bucket: avatars
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 3. Storage Policies for avatars bucket
-- =========================

-- SELECT: Anyone can read avatars (public bucket)
CREATE POLICY "avatars_select_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- INSERT: Authenticated users can upload to their own folder
CREATE POLICY "avatars_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Users can update their own avatars
CREATE POLICY "avatars_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Users can delete their own avatars
CREATE POLICY "avatars_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================
-- 4. Notify PostgREST to reload schema
-- =========================
NOTIFY pgrst, 'reload schema';

-- =========================
-- 5. Comments
-- =========================
COMMENT ON CONSTRAINT activity_events_actor_id_fkey ON public.activity_events IS 'FK to profiles for PostgREST join support';
