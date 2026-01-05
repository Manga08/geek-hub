-- ===========================================
-- GEEK-HUB: Group Invites + Grants Hardening
-- Phase 3P + 3P.1: Token-based invites system
-- Run this SQL in Supabase SQL Editor
-- ===========================================

-- =========================
-- 3P.1: Grants for helper functions
-- =========================

REVOKE ALL ON FUNCTION public.is_group_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO authenticated;

-- =========================
-- 3P: Group Invites Table
-- =========================

CREATE TABLE IF NOT EXISTS public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_role text NOT NULL DEFAULT 'member' CHECK (invite_role IN ('admin', 'member')),
  expires_at timestamptz NULL,
  max_uses int NOT NULL DEFAULT 1,
  uses_count int NOT NULL DEFAULT 0,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_invites_group_idx ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS group_invites_token_idx ON group_invites(token);

-- =========================
-- RLS for group_invites
-- =========================

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Admin can view invites for their groups
DROP POLICY IF EXISTS "group_invites_select_admin" ON group_invites;
CREATE POLICY "group_invites_select_admin"
  ON group_invites FOR SELECT
  USING (public.is_group_admin(group_invites.group_id));

-- Admin can create invites for their groups
DROP POLICY IF EXISTS "group_invites_insert_admin" ON group_invites;
CREATE POLICY "group_invites_insert_admin"
  ON group_invites FOR INSERT
  WITH CHECK (
    public.is_group_admin(group_invites.group_id)
    AND auth.uid() = created_by
  );

-- Admin can update (revoke) invites for their groups
DROP POLICY IF EXISTS "group_invites_update_admin" ON group_invites;
CREATE POLICY "group_invites_update_admin"
  ON group_invites FOR UPDATE
  USING (public.is_group_admin(group_invites.group_id));

-- Admin can delete invites for their groups
DROP POLICY IF EXISTS "group_invites_delete_admin" ON group_invites;
CREATE POLICY "group_invites_delete_admin"
  ON group_invites FOR DELETE
  USING (public.is_group_admin(group_invites.group_id));

-- =========================
-- Redeem Invite Function (SECURITY DEFINER)
-- =========================

CREATE OR REPLACE FUNCTION public.redeem_group_invite(invite_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_invite RECORD;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated', 'message', 'User must be authenticated');
  END IF;

  -- Find and lock the invite
  SELECT * INTO v_invite
  FROM group_invites
  WHERE token = invite_token
  FOR UPDATE;

  -- Check if invite exists
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'Invite token not found');
  END IF;

  -- Check if revoked
  IF v_invite.revoked THEN
    RETURN jsonb_build_object('error', 'revoked', 'message', 'Invite has been revoked');
  END IF;

  -- Check if expired
  IF v_invite.expires_at IS NOT NULL AND now() > v_invite.expires_at THEN
    RETURN jsonb_build_object('error', 'expired', 'message', 'Invite has expired');
  END IF;

  -- Check if max uses reached
  IF v_invite.uses_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('error', 'exhausted', 'message', 'Invite has reached maximum uses');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_invite.group_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'already_member', 'message', 'You are already a member of this group');
  END IF;

  -- Insert membership
  INSERT INTO group_members (group_id, user_id, member_role)
  VALUES (v_invite.group_id, v_user_id, v_invite.invite_role)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Increment uses_count atomically
  UPDATE group_invites
  SET uses_count = uses_count + 1
  WHERE id = v_invite.id;

  -- Update user's default group to the newly joined group
  UPDATE profiles
  SET default_group_id = v_invite.group_id
  WHERE id = v_user_id;

  -- Return success with group info
  SELECT jsonb_build_object(
    'success', true,
    'group_id', v_invite.group_id,
    'role', v_invite.invite_role,
    'group', (
      SELECT jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'created_by', g.created_by,
        'created_at', g.created_at
      )
      FROM groups g WHERE g.id = v_invite.group_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.redeem_group_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_group_invite(uuid) TO authenticated;

-- ===========================================
-- Done
-- ===========================================
