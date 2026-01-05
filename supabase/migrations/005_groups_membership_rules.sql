-- ===========================================
-- GEEK-HUB: Membership Rules + DB Hardening
-- Phase 3Q + 3Q.1: Role changes, leave, invites revocation
-- Run this SQL in Supabase SQL Editor
-- ===========================================

-- =========================
-- 3Q.1: Hardening group_invites
-- =========================

-- Add CHECK constraints (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_invites_max_uses_check'
  ) THEN
    ALTER TABLE group_invites ADD CONSTRAINT group_invites_max_uses_check CHECK (max_uses >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_invites_uses_count_check'
  ) THEN
    ALTER TABLE group_invites ADD CONSTRAINT group_invites_uses_count_check CHECK (uses_count >= 0);
  END IF;
END$$;

-- Restrict UPDATE policy on group_invites to only allow setting revoked=true
DROP POLICY IF EXISTS "group_invites_update_admin" ON group_invites;
CREATE POLICY "group_invites_update_admin"
  ON group_invites FOR UPDATE
  USING (public.is_group_admin(group_invites.group_id))
  WITH CHECK (
    public.is_group_admin(group_invites.group_id)
    AND revoked = true  -- Can only set revoked to true
  );

-- =========================
-- 3Q.1: Improved redeem_group_invite (atomic uses_count)
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
  v_rows_inserted int;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated', 'message', 'User must be authenticated');
  END IF;

  -- Ensure profile exists (creates if not exists)
  INSERT INTO profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

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

  -- Insert membership and check if actually inserted
  INSERT INTO group_members (group_id, user_id, member_role)
  VALUES (v_invite.group_id, v_user_id, v_invite.invite_role)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  -- Only increment uses_count if membership was actually inserted (atomic)
  IF v_rows_inserted > 0 THEN
    UPDATE group_invites
    SET uses_count = uses_count + 1
    WHERE id = v_invite.id;

    -- Update user's default group to the newly joined group
    UPDATE profiles
    SET default_group_id = v_invite.group_id
    WHERE id = v_user_id;
  ELSE
    -- Membership wasn't created (race condition - already member)
    RETURN jsonb_build_object('error', 'already_member', 'message', 'You are already a member of this group');
  END IF;

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

-- =========================
-- 3Q: Helper function - count admins in group
-- =========================

CREATE OR REPLACE FUNCTION public.count_group_admins(gid uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COUNT(*)::int
  FROM group_members
  WHERE group_id = gid AND member_role = 'admin';
$$;

REVOKE ALL ON FUNCTION public.count_group_admins(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_group_admins(uuid) TO authenticated;

-- =========================
-- 3Q: Set member role (SECURITY DEFINER)
-- =========================

CREATE OR REPLACE FUNCTION public.set_member_role(
  gid uuid,
  target_user uuid,
  new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_caller_id uuid;
  v_current_role text;
  v_admin_count int;
BEGIN
  -- Get current user
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated', 'message', 'User must be authenticated');
  END IF;

  -- Validate new_role
  IF new_role NOT IN ('admin', 'member') THEN
    RETURN jsonb_build_object('error', 'invalid_role', 'message', 'Role must be admin or member');
  END IF;

  -- Check caller is admin of this group
  IF NOT public.is_group_admin(gid) THEN
    RETURN jsonb_build_object('error', 'forbidden', 'message', 'Only admins can change roles');
  END IF;

  -- Get target user's current role
  SELECT member_role INTO v_current_role
  FROM group_members
  WHERE group_id = gid AND user_id = target_user;

  IF v_current_role IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'User is not a member of this group');
  END IF;

  -- If same role, nothing to do
  IF v_current_role = new_role THEN
    RETURN jsonb_build_object('success', true, 'message', 'Role unchanged');
  END IF;

  -- If demoting from admin, check we don't leave group without admins
  IF v_current_role = 'admin' AND new_role = 'member' THEN
    v_admin_count := public.count_group_admins(gid);
    IF v_admin_count <= 1 THEN
      RETURN jsonb_build_object('error', 'cannot_demote_last_admin', 'message', 'Cannot demote the last admin');
    END IF;
  END IF;

  -- Update the role
  UPDATE group_members
  SET member_role = new_role
  WHERE group_id = gid AND user_id = target_user;

  RETURN jsonb_build_object('success', true, 'new_role', new_role);
END;
$$;

REVOKE ALL ON FUNCTION public.set_member_role(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) TO authenticated;

-- =========================
-- 3Q: Remove member (SECURITY DEFINER)
-- =========================

CREATE OR REPLACE FUNCTION public.remove_member(
  gid uuid,
  target_user uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_caller_id uuid;
  v_target_role text;
  v_admin_count int;
BEGIN
  -- Get current user
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated', 'message', 'User must be authenticated');
  END IF;

  -- Check caller is admin of this group
  IF NOT public.is_group_admin(gid) THEN
    RETURN jsonb_build_object('error', 'forbidden', 'message', 'Only admins can remove members');
  END IF;

  -- Get target user's role
  SELECT member_role INTO v_target_role
  FROM group_members
  WHERE group_id = gid AND user_id = target_user;

  IF v_target_role IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'User is not a member of this group');
  END IF;

  -- If removing an admin, check we don't leave group without admins
  IF v_target_role = 'admin' THEN
    v_admin_count := public.count_group_admins(gid);
    IF v_admin_count <= 1 THEN
      RETURN jsonb_build_object('error', 'cannot_remove_last_admin', 'message', 'Cannot remove the last admin');
    END IF;
  END IF;

  -- Remove the member
  DELETE FROM group_members
  WHERE group_id = gid AND user_id = target_user;

  -- If removed user had this as default_group, clear it (they'll need to set a new one)
  UPDATE profiles
  SET default_group_id = NULL
  WHERE id = target_user AND default_group_id = gid;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.remove_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_member(uuid, uuid) TO authenticated;

-- =========================
-- 3Q: Leave group (SECURITY DEFINER)
-- =========================

CREATE OR REPLACE FUNCTION public.leave_group(gid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_admin_count int;
  v_other_group_id uuid;
  v_new_group_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated', 'message', 'User must be authenticated');
  END IF;

  -- Get user's role in this group
  SELECT member_role INTO v_user_role
  FROM group_members
  WHERE group_id = gid AND user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'You are not a member of this group');
  END IF;

  -- If user is admin, check we don't leave group without admins
  IF v_user_role = 'admin' THEN
    v_admin_count := public.count_group_admins(gid);
    IF v_admin_count <= 1 THEN
      RETURN jsonb_build_object('error', 'cannot_leave_as_last_admin', 'message', 'Cannot leave as the last admin. Promote another member first.');
    END IF;
  END IF;

  -- Remove membership
  DELETE FROM group_members
  WHERE group_id = gid AND user_id = v_user_id;

  -- Handle default_group_id if this was the user's default
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND default_group_id = gid) THEN
    -- Find another group the user belongs to
    SELECT group_id INTO v_other_group_id
    FROM group_members
    WHERE user_id = v_user_id
    ORDER BY joined_at ASC
    LIMIT 1;

    IF v_other_group_id IS NOT NULL THEN
      -- Set the other group as default
      UPDATE profiles SET default_group_id = v_other_group_id WHERE id = v_user_id;
      v_new_group_id := v_other_group_id;
    ELSE
      -- Create a new personal group for the user
      INSERT INTO groups (name, created_by)
      VALUES ('Mi grupo', v_user_id)
      RETURNING id INTO v_new_group_id;

      -- Add user as admin
      INSERT INTO group_members (group_id, user_id, member_role)
      VALUES (v_new_group_id, v_user_id, 'admin');

      -- Set as default
      UPDATE profiles SET default_group_id = v_new_group_id WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'new_default_group_id', v_new_group_id,
      'created_new_group', v_other_group_id IS NULL
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'new_default_group_id', null, 'created_new_group', false);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_group(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;

-- =========================
-- 3Q: Revoke invite (SECURITY DEFINER)
-- =========================

CREATE OR REPLACE FUNCTION public.revoke_invite(invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id uuid;
  v_invite_group_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated', 'message', 'User must be authenticated');
  END IF;

  -- Get invite's group_id
  SELECT group_id INTO v_invite_group_id
  FROM group_invites
  WHERE id = invite_id;

  IF v_invite_group_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'Invite not found');
  END IF;

  -- Check caller is admin of this group
  IF NOT public.is_group_admin(v_invite_group_id) THEN
    RETURN jsonb_build_object('error', 'forbidden', 'message', 'Only admins can revoke invites');
  END IF;

  -- Revoke the invite
  UPDATE group_invites
  SET revoked = true
  WHERE id = invite_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_invite(uuid) TO authenticated;

-- ===========================================
-- Done
-- ===========================================
