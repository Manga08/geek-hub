-- ===========================================
-- GEEK-HUB: Fix duplicate FKs to profiles
-- Migration 016 - Consolidate profile FKs
-- ===========================================
-- Problema: La migración 015 puede haber creado
-- group_members_user_id_profiles_fkey sin detectar que ya existía
-- group_members_user_id_fkey apuntando a profiles.
-- 
-- Esta migración:
-- 1) Detecta TODAS las FKs de group_members.user_id -> profiles.id
-- 2) Si hay más de 1, elimina las extras dejando solo una preferida
-- 3) Asegura ON DELETE CASCADE en la FK final
-- 4) Es idempotente (puede correrse múltiples veces)

-- ===========================================
-- 1) group_members.user_id -> profiles.id: Consolidar FKs
-- ===========================================
DO $$
DECLARE
  fk_count INTEGER;
  preferred_fk TEXT := 'group_members_user_id_fkey';
  alternative_fk TEXT := 'group_members_user_id_profiles_fkey';
  has_preferred BOOLEAN := FALSE;
  has_alternative BOOLEAN := FALSE;
  r RECORD;
  final_fk_name TEXT;
BEGIN
  -- Contar FKs de group_members.user_id -> profiles.id
  SELECT COUNT(*) INTO fk_count
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
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'profiles'
    AND ccu.column_name = 'id';

  RAISE NOTICE 'Found % FK(s) from group_members.user_id -> profiles.id', fk_count;

  IF fk_count = 0 THEN
    -- No hay FK, crear una
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Created FK group_members_user_id_fkey -> profiles.id with CASCADE';
    
  ELSIF fk_count = 1 THEN
    -- Solo hay una, asegurar que tenga CASCADE
    SELECT rc.constraint_name INTO final_fk_name
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
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'profiles'
    LIMIT 1;

    -- Verificar si tiene CASCADE (delete_rule = 'CASCADE')
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_schema = 'public'
        AND constraint_name = final_fk_name
        AND delete_rule = 'CASCADE'
    ) THEN
      -- Recrear con CASCADE
      EXECUTE format('ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS %I', final_fk_name);
      ALTER TABLE public.group_members
        ADD CONSTRAINT group_members_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
      RAISE NOTICE 'Recreated FK % with CASCADE as group_members_user_id_fkey', final_fk_name;
    ELSE
      RAISE NOTICE 'Existing FK % already has CASCADE', final_fk_name;
    END IF;

  ELSE
    -- Más de 1 FK: consolidar
    RAISE NOTICE 'Multiple FKs detected, consolidating...';

    -- Verificar cuáles existen
    SELECT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND constraint_name = preferred_fk
        AND table_name = 'group_members'
    ) INTO has_preferred;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND constraint_name = alternative_fk
        AND table_name = 'group_members'
    ) INTO has_alternative;

    -- Eliminar TODAS las FKs a profiles
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
        AND ccu.table_schema = 'public'
        AND ccu.table_name = 'profiles'
    LOOP
      EXECUTE format('ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
      RAISE NOTICE 'Dropped duplicate FK: %', r.constraint_name;
    END LOOP;

    -- Crear una sola FK limpia con CASCADE
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Created single FK group_members_user_id_fkey with CASCADE';
  END IF;
END $$;

-- ===========================================
-- 2) library_entries.user_id -> profiles.id: Misma lógica
-- ===========================================
DO $$
DECLARE
  fk_count INTEGER;
  r RECORD;
  final_fk_name TEXT;
BEGIN
  SELECT COUNT(*) INTO fk_count
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
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'profiles'
    AND ccu.column_name = 'id';

  RAISE NOTICE 'Found % FK(s) from library_entries.user_id -> profiles.id', fk_count;

  IF fk_count = 0 THEN
    ALTER TABLE public.library_entries
      ADD CONSTRAINT library_entries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Created FK library_entries_user_id_fkey -> profiles.id with CASCADE';

  ELSIF fk_count = 1 THEN
    SELECT rc.constraint_name INTO final_fk_name
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
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'profiles'
    LIMIT 1;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_schema = 'public'
        AND constraint_name = final_fk_name
        AND delete_rule = 'CASCADE'
    ) THEN
      EXECUTE format('ALTER TABLE public.library_entries DROP CONSTRAINT IF EXISTS %I', final_fk_name);
      ALTER TABLE public.library_entries
        ADD CONSTRAINT library_entries_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
      RAISE NOTICE 'Recreated FK % with CASCADE as library_entries_user_id_fkey', final_fk_name;
    ELSE
      RAISE NOTICE 'Existing FK % already has CASCADE', final_fk_name;
    END IF;

  ELSE
    RAISE NOTICE 'Multiple FKs detected on library_entries, consolidating...';

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
        AND ccu.table_schema = 'public'
        AND ccu.table_name = 'profiles'
    LOOP
      EXECUTE format('ALTER TABLE public.library_entries DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
      RAISE NOTICE 'Dropped duplicate FK: %', r.constraint_name;
    END LOOP;

    ALTER TABLE public.library_entries
      ADD CONSTRAINT library_entries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Created single FK library_entries_user_id_fkey with CASCADE';
  END IF;
END $$;

-- ===========================================
-- 3) Verificación final
-- ===========================================
DO $$
DECLARE
  gm_fk_count INTEGER;
  le_fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO gm_fk_count
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
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'profiles';

  SELECT COUNT(*) INTO le_fk_count
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
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'profiles';

  IF gm_fk_count != 1 THEN
    RAISE WARNING 'group_members should have exactly 1 FK to profiles, has %', gm_fk_count;
  ELSE
    RAISE NOTICE 'group_members FK count OK: 1';
  END IF;

  IF le_fk_count != 1 THEN
    RAISE WARNING 'library_entries should have exactly 1 FK to profiles, has %', le_fk_count;
  ELSE
    RAISE NOTICE 'library_entries FK count OK: 1';
  END IF;
END $$;

-- Recargar esquema en PostgREST
NOTIFY pgrst, 'reload schema';
