-- =============================================================================
-- Performance Indices for GeekHub
-- Run via: supabase db push or supabase migration up
-- =============================================================================

-- -----------------------------------------------------------------------------
-- library_entries: Optimiza lookups por external_id, tipo y proveedor
-- Usado por: /api/library/entry/lookup, /api/library/entry GET
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_library_entries_lookup
  ON library_entries (group_id, user_id, type, provider, external_id);

-- Índice parcial para búsquedas frecuentes por tipo
CREATE INDEX IF NOT EXISTS idx_library_entries_by_type
  ON library_entries (group_id, type, status);

-- -----------------------------------------------------------------------------
-- activity_events: Optimiza feed de actividad ordenado por fecha
-- Usado por: /api/activity GET (feed)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_events_feed
  ON activity_events (group_id, created_at DESC);

-- Índice para conteo de unread (excluye actor)
CREATE INDEX IF NOT EXISTS idx_activity_events_unread
  ON activity_events (group_id, actor_id, created_at);

-- -----------------------------------------------------------------------------
-- activity_reads: Unique constraint + índice para lookups rápidos
-- Usado por: /api/activity/unread, /api/activity/read
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_reads_unique
  ON activity_reads (user_id, group_id);

-- -----------------------------------------------------------------------------
-- group_members: Optimiza membresías por usuario y por grupo
-- Usado por: Group switcher, authorization checks
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_group_members_user
  ON group_members (user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group_user
  ON group_members (group_id, user_id);

-- -----------------------------------------------------------------------------
-- items: Optimiza búsquedas por external_id
-- Usado por: Batch lookups, item creation
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_items_external
  ON items (type, provider, external_id);

-- -----------------------------------------------------------------------------
-- list_items: Optimiza ordenación y lookups
-- Usado por: /api/lists/[listId]/items
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_list_items_order
  ON list_items (list_id, position);

CREATE INDEX IF NOT EXISTS idx_list_items_item
  ON list_items (item_id);

-- -----------------------------------------------------------------------------
-- EXPLAIN ANALYZE queries de ejemplo para verificar uso de índices:
-- -----------------------------------------------------------------------------
-- EXPLAIN ANALYZE
-- SELECT * FROM library_entries
-- WHERE group_id = 'uuid' AND user_id = 'uuid' AND type = 'movie' AND provider = 'tmdb';

-- EXPLAIN ANALYZE
-- SELECT * FROM activity_events
-- WHERE group_id = 'uuid' AND created_at > '2024-01-01' AND actor_id != 'uuid'
-- ORDER BY created_at DESC LIMIT 50;
