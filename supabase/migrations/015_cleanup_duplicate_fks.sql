-- ===========================================
-- GEEK-HUB: Cleanup duplicate FKs
-- Migration 015 - DB Hardening
-- ===========================================
-- Objetivo: Eliminar FKs duplicadas si existen y dejar
-- solo las FKs a profiles.id como referencia principal.
-- Esta migración es idempotente (puede correrse múltiples veces).

-- ===========================================
-- 1) group_members.user_id
-- Eliminar FK a auth.users si existe, mantener solo a profiles
-- ===========================================
DO $$
BEGIN
  -- Eliminar FK a auth.users si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'group_members'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.column_name = 'user_id'
      AND ccu.table_name = 'users'
      AND ccu.table_schema = 'auth'
  ) THEN
    -- Obtener el nombre del constraint y eliminarlo
    EXECUTE (
      SELECT 'ALTER TABLE public.group_members DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'group_members'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'user_id'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
      LIMIT 1
    );
    RAISE NOTICE 'Dropped FK group_members.user_id -> auth.users';
  END IF;
END $$;

-- Asegurar FK a profiles existe (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'group_members_user_id_profiles_fkey'
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
-- 2) library_entries.user_id
-- Eliminar FK a auth.users si existe, mantener solo a profiles
-- ===========================================
DO $$
BEGIN
  -- Eliminar FK a auth.users si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'library_entries'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.column_name = 'user_id'
      AND ccu.table_name = 'users'
      AND ccu.table_schema = 'auth'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.library_entries DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'library_entries'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'user_id'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
      LIMIT 1
    );
    RAISE NOTICE 'Dropped FK library_entries.user_id -> auth.users';
  END IF;
END $$;

-- Asegurar FK a profiles existe (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'library_entries_user_id_profiles_fkey'
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
    WHERE table_name = 'profiles'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE WARNING 'profiles table has no FK to auth.users - verify manually';
  ELSE
    RAISE NOTICE 'profiles FK chain verified';
  END IF;
END $$;

-- Recargar esquema en PostgREST
NOTIFY pgrst, 'reload schema';
