-- ===========================================
-- GEEK-HUB: Activity Reads (Unread Notifications)
-- Migration 012 - Track last read per user/group
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- =========================
-- 1. Activity Reads Table
-- =========================
CREATE TABLE IF NOT EXISTS public.activity_reads (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- =========================
-- 2. Trigger for updated_at
-- =========================
DROP TRIGGER IF EXISTS set_activity_reads_updated_at ON public.activity_reads;
CREATE TRIGGER set_activity_reads_updated_at
  BEFORE UPDATE ON public.activity_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 3. Index for efficient queries
-- =========================
CREATE INDEX IF NOT EXISTS activity_reads_group_user_idx
  ON public.activity_reads(group_id, user_id);

-- =========================
-- 4. RLS Policies
-- =========================
ALTER TABLE public.activity_reads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "activity_reads_select_policy" ON public.activity_reads;
DROP POLICY IF EXISTS "activity_reads_insert_policy" ON public.activity_reads;
DROP POLICY IF EXISTS "activity_reads_update_policy" ON public.activity_reads;

-- SELECT: Users can read their own read status for groups they're members of
CREATE POLICY "activity_reads_select_policy"
  ON public.activity_reads FOR SELECT
  USING (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- INSERT: Users can create read status for themselves in groups they're members of
CREATE POLICY "activity_reads_insert_policy"
  ON public.activity_reads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- UPDATE: Users can update their own read status for groups they're members of
CREATE POLICY "activity_reads_update_policy"
  ON public.activity_reads FOR UPDATE
  USING (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- No DELETE policy - read status persists

-- =========================
-- 5. Notify PostgREST
-- =========================
NOTIFY pgrst, 'reload schema';

-- =========================
-- 6. Comments
-- =========================
COMMENT ON TABLE public.activity_reads IS 'Tracks last read timestamp per user per group for unread notifications';
COMMENT ON COLUMN public.activity_reads.last_read_at IS 'Timestamp when user last viewed activity for this group';
