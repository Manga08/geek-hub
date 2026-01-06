// =========================
// Profile Types
// =========================

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  default_group_id: string | null;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileDTO {
  display_name?: string;
}
