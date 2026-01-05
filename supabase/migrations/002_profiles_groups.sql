-- ===========================================
-- GEEK-HUB: Profiles, Groups & Group Members
-- Phase 3N (fixed): Multi-tenant groups system
-- Run this SQL in Supabase SQL Editor
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Tables
-- =========================

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  default_group_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'member' CHECK (member_role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);

-- FK default_group_id -> groups (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_default_group_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_default_group_id_fkey
      FOREIGN KEY (default_group_id) REFERENCES groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================
-- updated_at triggers
-- =========================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS groups_updated_at ON groups;
CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- RLS
-- =========================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- =========================
-- Policies: profiles (drop old + create new)
-- =========================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view group member profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_same_group" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Select: own profile OR profiles of members in same group
CREATE POLICY "profiles_select_own_or_same_group"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =========================
-- Policies: groups (drop old + create new)
-- =========================

DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON groups;
DROP POLICY IF EXISTS "groups_select_member" ON groups;
DROP POLICY IF EXISTS "groups_insert_creator" ON groups;
DROP POLICY IF EXISTS "groups_update_admin" ON groups;
DROP POLICY IF EXISTS "groups_delete_admin" ON groups;

CREATE POLICY "groups_select_member"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "groups_insert_creator"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

-- =========================
-- Policies: group_members (drop old + create new)
-- =========================

DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves to groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can update member roles" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_creator_self_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_admin_add" ON group_members;
DROP POLICY IF EXISTS "group_members_update_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_self_leave" ON group_members;

CREATE POLICY "group_members_select_member"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

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
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "group_members_delete_admin"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "group_members_delete_self_leave"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- =========================
-- Backfill
-- =========================

DO $$
DECLARE
  r RECORD;
  new_group_id uuid;
BEGIN
  -- Ensure profile rows exist for all auth users
  INSERT INTO profiles (id, display_name)
  SELECT u.id, COALESCE(split_part(u.email, '@', 1), 'user')
  FROM auth.users u
  ON CONFLICT (id) DO NOTHING;

  -- Create default group for profiles missing default_group_id
  FOR r IN
    SELECT p.id FROM profiles p
    WHERE p.default_group_id IS NULL
  LOOP
    INSERT INTO groups (name, created_by)
    VALUES ('Mi grupo', r.id)
    RETURNING id INTO new_group_id;

    INSERT INTO group_members (group_id, user_id, member_role)
    VALUES (new_group_id, r.id, 'admin')
    ON CONFLICT DO NOTHING;

    UPDATE profiles
    SET default_group_id = new_group_id
    WHERE id = r.id;
  END LOOP;

  -- Ensure membership exists for default_group_id
  FOR r IN
    SELECT p.id, p.default_group_id AS gid
    FROM profiles p
    WHERE p.default_group_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = p.default_group_id
          AND gm.user_id = p.id
      )
  LOOP
    INSERT INTO group_members (group_id, user_id, member_role)
    VALUES (r.gid, r.id, 'admin')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ===========================================
-- Done
-- ===========================================
