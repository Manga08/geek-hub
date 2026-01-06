-- ===========================================
-- GEEK-HUB: Lists Multi-Tenant Schema
-- Migration 008 - Shared Lists by Group
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- Ensure RLS is enabled on library_entries (idempotent)
ALTER TABLE public.library_entries ENABLE ROW LEVEL SECURITY;

-- =========================
-- Table: lists
-- =========================
CREATE TABLE IF NOT EXISTS public.lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for group queries
CREATE INDEX IF NOT EXISTS lists_group_idx ON public.lists(group_id);
CREATE INDEX IF NOT EXISTS lists_created_by_idx ON public.lists(created_by);

-- updated_at trigger (reuse existing function from 002)
DROP TRIGGER IF EXISTS lists_updated_at ON public.lists;
CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- Table: list_items
-- =========================
CREATE TABLE IF NOT EXISTS public.list_items (
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('game', 'movie', 'tv', 'anime')),
  provider text NOT NULL CHECK (provider IN ('rawg', 'tmdb')),
  external_id text NOT NULL,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  poster_url text,
  note text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, item_type, provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS list_items_list_idx ON public.list_items(list_id);
CREATE INDEX IF NOT EXISTS list_items_position_idx ON public.list_items(list_id, position);
CREATE INDEX IF NOT EXISTS list_items_added_by_idx ON public.list_items(added_by);

-- =========================
-- RLS: lists
-- =========================
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- SELECT: Group members can view lists
CREATE POLICY "lists_select_policy"
  ON public.lists FOR SELECT
  USING (public.is_group_member(group_id));

-- INSERT: Group members can create lists
CREATE POLICY "lists_insert_policy"
  ON public.lists FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_group_member(group_id)
  );

-- UPDATE: Owner or group admin can update
CREATE POLICY "lists_update_policy"
  ON public.lists FOR UPDATE
  USING (
    public.is_group_member(group_id)
    AND (created_by = auth.uid() OR public.is_group_admin(group_id))
  )
  WITH CHECK (
    public.is_group_member(group_id)
    AND (created_by = auth.uid() OR public.is_group_admin(group_id))
  );

-- DELETE: Owner or group admin can delete
CREATE POLICY "lists_delete_policy"
  ON public.lists FOR DELETE
  USING (
    public.is_group_member(group_id)
    AND (created_by = auth.uid() OR public.is_group_admin(group_id))
  );

-- =========================
-- RLS: list_items
-- =========================
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get group_id from list_id
CREATE OR REPLACE FUNCTION public.get_list_group_id(p_list_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT group_id FROM public.lists WHERE id = p_list_id;
$$;

-- SELECT: Group members can view list items
CREATE POLICY "list_items_select_policy"
  ON public.list_items FOR SELECT
  USING (public.is_group_member(public.get_list_group_id(list_id)));

-- INSERT: Group members can add items
CREATE POLICY "list_items_insert_policy"
  ON public.list_items FOR INSERT
  WITH CHECK (
    added_by = auth.uid()
    AND public.is_group_member(public.get_list_group_id(list_id))
  );

-- UPDATE: Item owner or group admin can update
CREATE POLICY "list_items_update_policy"
  ON public.list_items FOR UPDATE
  USING (
    public.is_group_member(public.get_list_group_id(list_id))
    AND (added_by = auth.uid() OR public.is_group_admin(public.get_list_group_id(list_id)))
  )
  WITH CHECK (
    public.is_group_member(public.get_list_group_id(list_id))
    AND (added_by = auth.uid() OR public.is_group_admin(public.get_list_group_id(list_id)))
  );

-- DELETE: Item owner or group admin can delete
CREATE POLICY "list_items_delete_policy"
  ON public.list_items FOR DELETE
  USING (
    public.is_group_member(public.get_list_group_id(list_id))
    AND (added_by = auth.uid() OR public.is_group_admin(public.get_list_group_id(list_id)))
  );
