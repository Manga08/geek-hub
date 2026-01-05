-- ===========================================
-- GEEK-HUB: Activity Log + SQL Helpers Hardening
-- Migration 009 - Group-scoped Activity Feed
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- =========================
-- 1. Hardening: Fix get_list_group_id helper
-- =========================
CREATE OR REPLACE FUNCTION public.get_list_group_id(p_list_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT group_id FROM lists WHERE id = p_list_id;
$$;

-- Revoke public access, grant only to authenticated
REVOKE ALL ON FUNCTION public.get_list_group_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_list_group_id(uuid) TO authenticated;

-- Also harden is_group_member and is_group_admin permissions (idempotent)
REVOKE ALL ON FUNCTION public.is_group_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_group_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO authenticated;

-- =========================
-- 2. Activity Events Table
-- =========================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('group', 'list', 'list_item', 'library_entry', 'invite', 'member')),
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS activity_events_group_created_idx 
  ON public.activity_events(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_actor_idx 
  ON public.activity_events(actor_id);
CREATE INDEX IF NOT EXISTS activity_events_entity_idx 
  ON public.activity_events(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- =========================
-- 3. RLS: Insert-only for members
-- =========================
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- SELECT: Group members can view activity
CREATE POLICY "activity_events_select_policy"
  ON public.activity_events FOR SELECT
  USING (public.is_group_member(group_id));

-- INSERT: Actor must be self and member of group
CREATE POLICY "activity_events_insert_policy"
  ON public.activity_events FOR INSERT
  WITH CHECK (
    actor_id = auth.uid()
    AND public.is_group_member(group_id)
  );

-- NO UPDATE policy - events are immutable
-- NO DELETE policy - events are permanent (admin could delete via direct DB access if needed)

-- =========================
-- 4. Event Types Reference (documentation)
-- =========================
COMMENT ON TABLE public.activity_events IS 'Group-scoped activity feed for collaboration';
COMMENT ON COLUMN public.activity_events.event_type IS 'Action type: created, updated, deleted, joined, left, invited, role_changed, etc.';
COMMENT ON COLUMN public.activity_events.entity_type IS 'Entity affected: group, list, list_item, library_entry, invite, member';
COMMENT ON COLUMN public.activity_events.metadata IS 'Small payload with context: {name, title, item_type, provider, external_id, etc.}';
