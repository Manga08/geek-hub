-- ===========================================
-- GEEK-HUB: Profiles, Groups & Group Members
-- Phase 3N: Multi-tenant groups system
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- Table: profiles
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  default_group_id uuid, -- Will add FK after groups table exists
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can view profiles of group members (for "Us" feature)
CREATE POLICY "Users can view group member profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = profiles.id
    )
  );

-- ===========================================
-- Table: groups
-- ===========================================
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.member_role = 'admin'
    )
  );

CREATE POLICY "Group admins can delete groups"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.member_role = 'admin'
    )
  );

-- ===========================================
-- Table: group_members
-- ===========================================
CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'member' CHECK (member_role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);

-- Enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_members
CREATE POLICY "Users can view members of groups they belong to"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "Group admins can update member roles"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "Group admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.member_role = 'admin'
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- Add default_group_id column if missing, then FK
-- ===========================================
DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'default_group_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN default_group_id uuid;
  END IF;
  
  -- Add FK if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_default_group_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_default_group_id_fkey
      FOREIGN KEY (default_group_id) REFERENCES groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===========================================
-- Auto-update timestamps
-- ===========================================
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

-- ===========================================
-- Backfill: Create default groups for existing users
-- ===========================================
DO $$
DECLARE
  user_rec RECORD;
  new_group_id uuid;
BEGIN
  -- Loop through users who don't have a profile yet
  FOR user_rec IN 
    SELECT id, email FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
  LOOP
    -- Create profile
    INSERT INTO profiles (id, display_name)
    VALUES (user_rec.id, split_part(user_rec.email, '@', 1))
    ON CONFLICT DO NOTHING;
    
    -- Create default group
    INSERT INTO groups (name, created_by)
    VALUES ('Mi grupo', user_rec.id)
    RETURNING id INTO new_group_id;
    
    -- Add user as admin
    INSERT INTO group_members (group_id, user_id, member_role)
    VALUES (new_group_id, user_rec.id, 'admin')
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- For existing profiles without groups
  FOR user_rec IN
    SELECT p.id FROM profiles p
    WHERE NOT EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = p.id)
  LOOP
    INSERT INTO groups (name, created_by)
    VALUES ('Mi grupo', user_rec.id)
    RETURNING id INTO new_group_id;
    
    INSERT INTO group_members (group_id, user_id, member_role)
    VALUES (new_group_id, user_rec.id, 'admin')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ===========================================
-- Done! Profiles, Groups & Group Members ready
-- ===========================================
