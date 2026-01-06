import type { UserProfile } from "@/features/profile/types";
import type { GroupRow, GroupRole } from "@/features/groups/types";
import type { ActivityFeedResponse } from "@/features/activity/types";

// =========================
// App Init Types
// =========================

export interface AppInitResponse {
  profile: UserProfile;
  groupsList: GroupRow[];
  currentGroup: { group: GroupRow; role: GroupRole } | null;
  unreadCount: number;
  activityFeed: ActivityFeedResponse;
}
