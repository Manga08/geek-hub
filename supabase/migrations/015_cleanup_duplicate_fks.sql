-- ===========================================
-- GEEK-HUB: Cleanup duplicate FKs
-- Migration 015 - DB Hardening (v2 - fixed detection)
-- ===========================================
-- Objetivo: Eliminar TODAS las FKs que referencien auth.users desde
-- group_members.user_id y library_entries.user_id, dejando solo
-- las FKs a profiles.id como referencia principal.
-- Esta migración es idempotente (puede correrse múltiples veces).
--
-- Fix v2: Usa referential_constraints + key_column_usage para detectar
-- correctamente por columna LOCAL (user_id) y tabla REFERENCIADA (auth.users).

-- ===========================================
-- 1) group_members.user_id -> Eliminar TODAS las FK a auth.users
-- ===========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT rc.constraint_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON  rc.constraint_schema = kcu.constraint_schema
      AND rc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON  rc.constraint_schema = ccu.constraint_schema
      AND rc.constraint_name = ccu.constraint_name
    WHERE kcu.table_schema = 'public'
      AND kcu.table_name = 'group_members'
      AND kcu.column_name = 'user_id'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  LOOP
    EXECUTE format('ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
    RAISE NOTICE 'Dropped FK constraint % from group_members (-> auth.users)', r.constraint_name;
  END LOOP;
END $$;

-- Asegurar FK a profiles existe (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'group_members_user_id_profiles_fkey'
      AND table_name = 'group_members'
  ) THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK group_members.user_id -> profiles.id';
  ELSE
    RAISE NOTICE 'FK group_members_user_id_profiles_fkey already exists';
  END IF;
END $$;

-- ===========================================
-- 2) library_entries.user_id -> Eliminar TODAS las FK a auth.users
-- ===========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT rc.constraint_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON  rc.constraint_schema = kcu.constraint_schema
      AND rc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON  rc.constraint_schema = ccu.constraint_schema
      AND rc.constraint_name = ccu.constraint_name
    WHERE kcu.table_schema = 'public'
      AND kcu.table_name = 'library_entries'
      AND kcu.column_name = 'user_id'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  LOOP
    EXECUTE format('ALTER TABLE public.library_entries DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
    RAISE NOTICE 'Dropped FK constraint % from library_entries (-> auth.users)', r.constraint_name;
  END LOOP;
END $$;

-- Asegurar FK a profiles existe (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'library_entries_user_id_profiles_fkey'
      AND table_name = 'library_entries'
  ) THEN
    ALTER TABLE public.library_entries
      ADD CONSTRAINT library_entries_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK library_entries.user_id -> profiles.id';
  ELSE
    RAISE NOTICE 'FK library_entries_user_id_profiles_fkey already exists';
  END IF;
END $$;

-- ===========================================
-- 3) Verificar integridad de la cadena profiles -> auth.users
-- (Esta FK ya debe existir y no se modifica)
-- ===========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE WARNING 'profiles table has no FK to auth.users - verify manually';
  ELSE
    RAISE NOTICE 'profiles FK chain verified';
  END IF;
END $$;

-- Recargar esquema en PostgREST
NOTIFY pgrst, 'reload schema';
