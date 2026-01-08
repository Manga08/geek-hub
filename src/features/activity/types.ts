import type { EventType, EntityType, ActivityMetadata } from "@/lib/activity-log";

// =========================
// Activity Event Types
// =========================

export interface ActivityProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ActivityEvent {
  id: string;
  group_id: string;
  actor_id: string;
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string | null;
  metadata: ActivityMetadata;
  created_at: string;
  profiles: ActivityProfile | null;
}

export interface ActivityFeedResponse {
  events: ActivityEvent[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ActivityFilters {
  limit?: number;
  before?: string;
  entityType?: EntityType;
}

// =========================
// Event Display Helpers
// =========================

export const EVENT_LABELS: Record<EventType, string> = {
  // Lists
  list_created: "creó la lista",
  list_updated: "actualizó la lista",
  list_deleted: "eliminó la lista",
  // List Items
  list_item_added: "agregó a la lista",
  list_item_removed: "quitó de la lista",
  list_item_reordered: "reordenó items en",
  // Library
  library_entry_added: "agregó a su biblioteca",
  library_entry_updated: "actualizó en su biblioteca",
  library_entry_deleted: "quitó de su biblioteca",
  library_entry_favorited: "marcó como favorito",
  library_entry_unfavorited: "quitó de favoritos",
  // Members
  member_joined: "se unió al grupo",
  member_left: "dejó el grupo",
  member_removed: "fue removido del grupo",
  member_role_changed: "cambió el rol de",
  // Invites
  invite_created: "creó una invitación",
  invite_revoked: "revocó una invitación",
  invite_redeemed: "usó una invitación",
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  group: "👥",
  list: "📋",
  list_item: "📌",
  library_entry: "📚",
  invite: "✉️",
  member: "👤",
};

/**
 * Generate human-readable description for an activity event
 */
export function getEventDescription(event: ActivityEvent): string {
  const actorName = event.profiles?.display_name ?? "Usuario";

  // Fix: Handle malformed event types from legacy data or bad parsing
  const rawType = event.event_type as string;
  if (rawType === '["user", "joined_group"]' || rawType.includes("joined_group")) {
    return `${actorName} se unió al grupo`;
  }

  const label = EVENT_LABELS[event.event_type] ?? event.event_type;
  const meta = event.metadata;

  switch (event.event_type) {
    // Lists
    case "list_created":
    case "list_updated":
    case "list_deleted":
      return `${actorName} ${label} "${meta.list_name ?? meta.name ?? "Sin nombre"}"`;

    // List Items
    case "list_item_added":
    case "list_item_removed":
      return `${actorName} ${label} "${meta.list_name}": ${meta.item_title ?? "item"}`;

    case "list_item_reordered":
      return `${actorName} ${label} "${meta.list_name}"`;

    // Library
    case "library_entry_added":
    case "library_entry_deleted":
    case "library_entry_favorited":
    case "library_entry_unfavorited":
      return `${actorName} ${label} "${meta.item_title ?? "item"}"`;

    case "library_entry_updated":
      if (meta.new_status) {
        return `${actorName} marcó "${meta.item_title}" como ${meta.new_status}`;
      }
      return `${actorName} ${label} "${meta.item_title ?? "item"}"`;

    // Members
    case "member_joined":
    case "member_left":
      return `${actorName} ${label}`;

    case "member_removed":
      return `${meta.member_name ?? "Un miembro"} ${label}`;

    case "member_role_changed":
      return `${actorName} ${label} ${meta.member_name ?? "un miembro"} a ${meta.new_role}`;

    // Invites
    case "invite_created":
    case "invite_revoked":
    case "invite_redeemed":
      return `${actorName} ${label}`;

    default:
      return `${actorName} ${label}`;
  }
}
