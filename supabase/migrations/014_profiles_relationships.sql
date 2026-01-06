-- ===========================================
-- GEEK-HUB: Profiles relationship helpers
-- Migration 014 - FKs to profiles for joins
-- ===========================================

-- 1) Backfill profiles faltantes (seguridad)
INSERT INTO public.profiles (id, display_name)
SELECT u.id, split_part(u.email, '@', 1)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2) FK group_members.user_id -> profiles.id (para joins en PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'group_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3) FK library_entries.user_id -> profiles.id (para "Our Ratings")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'library_entries_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.library_entries
      ADD CONSTRAINT library_entries_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
