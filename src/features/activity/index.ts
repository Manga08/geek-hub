// =========================
// Activity Feature Exports
// =========================

// Types
export type {
  ActivityEvent,
  ActivityFeedResponse,
  ActivityFilters,
  ActivityProfile,
} from "./types";

export {
  EVENT_LABELS,
  ENTITY_ICONS,
  getEventDescription,
} from "./types";

// Queries
export {
  activityKeys,
  fetchActivityFeed,
  fetchUnreadCount,
  markActivityRead,
} from "./queries";
export type { UnreadCountResponse } from "./queries";

// Hooks
export {
  useActivityFeed,
  flattenActivityEvents,
  useUnreadActivityCount,
  useMarkActivityRead,
} from "./hooks";
export type { UseActivityFeedOptions } from "./hooks";
