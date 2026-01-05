-- ===========================================
-- GEEK-HUB: Library Entries Multi-Tenant Migration
-- Migration 007 - Add group_id support with RLS
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- 1. Add group_id column to library_entries
-- We use a nullable column first, then backfill, then set NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'library_entries' 
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.library_entries ADD COLUMN group_id uuid;
  END IF;
END $$;

-- 2. Backfill existing entries with user's default_group_id
UPDATE public.library_entries le
SET group_id = (
  SELECT p.default_group_id 
  FROM public.profiles p 
  WHERE p.id = le.user_id
)
WHERE le.group_id IS NULL;

-- 3. For any remaining NULL entries (user has no default_group), 
-- use their first group membership
UPDATE public.library_entries le
SET group_id = (
  SELECT gm.group_id 
  FROM public.group_members gm 
  WHERE gm.user_id = le.user_id 
  ORDER BY gm.joined_at ASC 
  LIMIT 1
)
WHERE le.group_id IS NULL;

-- 4. Now set NOT NULL constraint (only if all rows have a value)
DO $$
BEGIN
  -- Check if there are any NULL group_id values remaining
  IF NOT EXISTS (SELECT 1 FROM public.library_entries WHERE group_id IS NULL) THEN
    -- Safe to add NOT NULL constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'library_entries' 
      AND column_name = 'group_id'
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE public.library_entries ALTER COLUMN group_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- 5. Add FK constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'library_entries_group_id_fkey'
    AND table_name = 'library_entries'
  ) THEN
    ALTER TABLE public.library_entries
      ADD CONSTRAINT library_entries_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Create index for group_id queries
CREATE INDEX IF NOT EXISTS library_entries_group_idx 
  ON public.library_entries(group_id);

-- 7. Update unique constraint to be per-group instead of per-user
-- First drop the old index
DROP INDEX IF EXISTS library_entries_unique_idx;

-- Create new unique index per group+user+type+provider+external_id
CREATE UNIQUE INDEX IF NOT EXISTS library_entries_unique_idx 
  ON public.library_entries(group_id, user_id, type, provider, external_id);

-- 8. Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own entries" ON public.library_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.library_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.library_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.library_entries;

-- 9. Create new multi-tenant RLS policies using is_group_member helper
-- SELECT: Group members can view all group entries
CREATE POLICY "library_entries_select_policy"
  ON public.library_entries FOR SELECT
  USING (public.is_group_member(group_id));

-- INSERT: Group members can insert entries in their groups
CREATE POLICY "library_entries_insert_policy"
  ON public.library_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- UPDATE: Only entry owner within group can update
CREATE POLICY "library_entries_update_policy"
  ON public.library_entries FOR UPDATE
  USING (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- DELETE: Only entry owner within group can delete
CREATE POLICY "library_entries_delete_policy"
  ON public.library_entries FOR DELETE
  USING (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- 10. Update indexes for group-based queries
DROP INDEX IF EXISTS library_entries_user_favorites_idx;
DROP INDEX IF EXISTS library_entries_user_status_idx;

CREATE INDEX IF NOT EXISTS library_entries_group_favorites_idx 
  ON public.library_entries(group_id, is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS library_entries_group_status_idx 
  ON public.library_entries(group_id, status);

CREATE INDEX IF NOT EXISTS library_entries_group_user_idx 
  ON public.library_entries(group_id, user_id);
