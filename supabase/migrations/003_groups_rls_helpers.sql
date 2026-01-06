-- ===========================================
-- GEEK-HUB: RLS Helpers for Groups
-- Phase 3O.1: Avoid recursive policy queries
-- Run this SQL in Supabase SQL Editor
-- ===========================================

-- =========================
-- Helper Functions (SECURITY DEFINER)
-- =========================

-- Check if current user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid
      AND user_id = auth.uid()
  );
$$;

-- Check if current user is admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid
      AND user_id = auth.uid()
      AND member_role = 'admin'
  );
$$;

-- =========================
-- Rewrite group_members policies using helpers
-- =========================

-- Drop old policies
DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_creator_self_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_admin_add" ON group_members;
DROP POLICY IF EXISTS "group_members_update_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_self_leave" ON group_members;

-- Recreate with helper functions (no recursive queries)
CREATE POLICY "group_members_select_member"
  ON group_members FOR SELECT
  USING (public.is_group_member(group_members.group_id));

-- Creator can add self as admin (needed for default group creation)
CREATE POLICY "group_members_insert_creator_self_admin"
  ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND member_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
        AND g.created_by = auth.uid()
    )
  );

-- Admin can add members (future invites)
CREATE POLICY "group_members_insert_admin_add"
  ON group_members FOR INSERT
  WITH CHECK (public.is_group_admin(group_members.group_id));

CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (public.is_group_admin(group_members.group_id));

CREATE POLICY "group_members_delete_admin"
  ON group_members FOR DELETE
  USING (public.is_group_admin(group_members.group_id));

CREATE POLICY "group_members_delete_self_leave"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- =========================
-- Also update groups policies to use helpers
-- =========================

DROP POLICY IF EXISTS "groups_select_member" ON groups;
DROP POLICY IF EXISTS "groups_update_admin" ON groups;
DROP POLICY IF EXISTS "groups_delete_admin" ON groups;

CREATE POLICY "groups_select_member"
  ON groups FOR SELECT
  USING (public.is_group_member(groups.id));

CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  USING (public.is_group_admin(groups.id));

CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  USING (public.is_group_admin(groups.id));

-- ===========================================
-- Done
-- ===========================================
