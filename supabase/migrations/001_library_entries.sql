-- ===========================================
-- GEEK-HUB: Library Entries Table + RLS
-- Run this SQL in your Supabase SQL Editor
-- ===========================================

-- Enable pgcrypto for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: library_entries
CREATE TABLE IF NOT EXISTS library_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('game', 'movie', 'tv', 'anime')),
  provider text NOT NULL CHECK (provider IN ('rawg', 'tmdb')),
  external_id text NOT NULL,
  title text,
  poster_url text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'dropped')),
  rating integer CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  notes text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one entry per user+type+provider+external_id
CREATE UNIQUE INDEX IF NOT EXISTS library_entries_unique_idx 
  ON library_entries(user_id, type, provider, external_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS library_entries_user_favorites_idx 
  ON library_entries(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS library_entries_user_status_idx 
  ON library_entries(user_id, status);

-- Enable RLS
ALTER TABLE library_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own entries"
  ON library_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON library_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON library_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON library_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_library_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS library_entries_updated_at ON library_entries;
CREATE TRIGGER library_entries_updated_at
  BEFORE UPDATE ON library_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_library_entry_updated_at();
