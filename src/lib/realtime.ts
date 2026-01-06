import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";

// =========================
// Types
// =========================

export interface ActivityEventPayload {
  id: string;
  group_id: string;
  actor_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ActivityInsertCallback = (payload: ActivityEventPayload) => void;

// =========================
// Activity Realtime Subscription
// =========================

/**
 * Subscribe to realtime activity events for a specific group.
 * Returns an unsubscribe function to clean up the subscription.
 */
export function subscribeToActivity(
  groupId: string,
  onInsert: ActivityInsertCallback
): () => void {
  const supabase = createSupabaseBrowserClient();
  
  if (!supabase) {
    console.warn("Supabase client not available for realtime");
    return () => {};
  }

  const channel: RealtimeChannel = supabase
    .channel(`activity:${groupId}`)
    .on<ActivityEventPayload>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activity_events",
        filter: `group_id=eq.${groupId}`,
      },
      (payload: RealtimePostgresInsertPayload<ActivityEventPayload>) => {
        if (payload.new) {
          onInsert(payload.new);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.debug(`[Realtime] Subscribed to activity:${groupId}`);
      }
      if (status === "CHANNEL_ERROR") {
        console.error(`[Realtime] Channel error for activity:${groupId}`);
      }
    });

  // Return unsubscribe function
  return () => {
    console.debug(`[Realtime] Unsubscribing from activity:${groupId}`);
    supabase.removeChannel(channel);
  };
}
