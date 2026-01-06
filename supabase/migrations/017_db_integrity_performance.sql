-- ===========================================
-- GEEK-HUB: DB Integrity + Performance
-- Migration 017 - Índices y constraints adicionales
-- ===========================================
-- Esta migración añade índices para queries frecuentes.
-- Es IDEMPOTENTE (safe multiple runs).
--
-- NOTA: completed_at no existe en library_entries (stats usa updated_at o status='completed').
-- Los constraints de rating, status y member_role ya existen en migraciones anteriores.

-- ===========================================
-- 1) ÍNDICES para library_entries
-- ===========================================

-- Index para listar librería ordenada por updated_at (feed de grupo)
-- Cubre: SELECT * FROM library_entries WHERE group_id = ? ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS library_entries_group_updated_idx
  ON public.library_entries(group_id, updated_at DESC);

-- Index para "My Library" filtrada por usuario y ordenada por updated_at
-- Cubre: SELECT * FROM library_entries WHERE group_id = ? AND user_id = ? ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS library_entries_group_user_updated_idx
  ON public.library_entries(group_id, user_id, updated_at DESC);

-- Index para queries de items completados por grupo (stats)
-- Cubre: SELECT * FROM library_entries WHERE group_id = ? AND status = 'completed'
-- Nota: Este es un índice parcial solo para entries completadas
CREATE INDEX IF NOT EXISTS library_entries_group_completed_idx
  ON public.library_entries(group_id, updated_at DESC)
  WHERE status = 'completed';

-- ===========================================
-- 2) ÍNDICES para activity_events (performance feed)
-- ===========================================

-- Index compuesto para paginación del feed de actividad
-- Cubre: SELECT * FROM activity_events WHERE group_id = ? ORDER BY created_at DESC LIMIT ?
-- Nota: Ya existe activity_events_group_created_idx pero verificamos
CREATE INDEX IF NOT EXISTS activity_events_group_created_desc_idx
  ON public.activity_events(group_id, created_at DESC);

-- ===========================================
-- 3) VERIFICACIÓN de constraints existentes
-- ===========================================

-- Los siguientes constraints YA EXISTEN en migraciones previas:
--
-- library_entries.rating:
--   CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10))
--   Definido en: 001_library_entries.sql
--
-- library_entries.status:
--   CHECK (status IN ('planned', 'in_progress', 'completed', 'dropped'))
--   Definido en: 001_library_entries.sql
--
-- group_members.member_role:
--   CHECK (member_role IN ('admin', 'member'))
--   Definido en: 002_profiles_groups.sql
--
-- NO se recrean para evitar duplicación.

-- ===========================================
-- 4) Verificación de índices creados
-- ===========================================
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'library_entries'
    AND indexname LIKE 'library_entries_group_%';

  RAISE NOTICE 'library_entries tiene % índices de grupo', idx_count;
END $$;

-- Recargar esquema en PostgREST
NOTIFY pgrst, 'reload schema';
