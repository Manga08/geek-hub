import { createSupabaseServerClient } from "@/lib/supabase/server";

// =========================
// Event Types
// =========================

export type EventType =
  // Lists
  | "list_created"
  | "list_updated"
  | "list_deleted"
  // List Items
  | "list_item_added"
  | "list_item_removed"
  | "list_item_reordered"
  // Library
  | "library_entry_added"
  | "library_entry_updated"
  | "library_entry_deleted"
  | "library_entry_favorited"
  | "library_entry_unfavorited"
  // Group/Members
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "member_role_changed"
  // Invites
  | "invite_created"
  | "invite_revoked"
  | "invite_redeemed";

export type EntityType = "group" | "list" | "list_item" | "library_entry" | "invite" | "member";

export interface ActivityMetadata {
  // List context
  list_name?: string;
  list_id?: string;
  // Item context
  item_title?: string;
  item_type?: string;
  provider?: string;
  external_id?: string;
  // Member context
  member_name?: string;
  member_email?: string;
  role?: string;
  new_role?: string;
  removed_user_id?: string;
  target_user_id?: string;
  // Status context
  status?: string;
  new_status?: string;
  // Invite context
  invite_role?: string;
  max_uses?: number;
  // Group context
  group_name?: string;
  // Generic
  name?: string;
  description?: string;
}

export interface LogEventParams {
  groupId: string;
  actorId: string;
  eventType: EventType;
  entityType: EntityType;
  entityId?: string;
  metadata?: ActivityMetadata;
}

// =========================
// Activity Log Service
// =========================

/**
 * Log an activity event to the group's activity feed.
 * This is a fire-and-forget operation - errors are logged but don't throw.
 */
export async function logActivityEvent(params: LogEventParams): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("activity_events").insert({
      group_id: params.groupId,
      actor_id: params.actorId,
      event_type: params.eventType,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });

    if (error) {
      console.error("[ActivityLog] Failed to log event:", error.message, params);
    }
  } catch (err) {
    console.error("[ActivityLog] Unexpected error:", err);
  }
}

/**
 * Helper to get current user's default group ID
 */
export async function getCurrentGroupId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("default_group_id")
      .eq("id", user.id)
      .single();

    return profile?.default_group_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Convenience function that auto-resolves groupId and actorId
 */
export async function logActivity(
  eventType: EventType,
  entityType: EntityType,
  options?: {
    entityId?: string;
    metadata?: ActivityMetadata;
    groupId?: string; // Override if known
  }
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[ActivityLog] No authenticated user, skipping log");
      return;
    }

    const groupId = options?.groupId ?? await getCurrentGroupId();
    
    if (!groupId) {
      console.warn("[ActivityLog] No group context, skipping log");
      return;
    }

    await logActivityEvent({
      groupId,
      actorId: user.id,
      eventType,
      entityType,
      entityId: options?.entityId,
      metadata: options?.metadata,
    });
  } catch (err) {
    console.error("[ActivityLog] Error in logActivity:", err);
  }
}
