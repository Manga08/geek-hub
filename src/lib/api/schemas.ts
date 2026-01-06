/**
 * Zod schemas for API input validation
 *
 * Centralized validation schemas for all API endpoints.
 * Use these to validate query params and request bodies.
 */
import { z } from "zod";

// ============ Common ============

/** UUID v4 validation */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/** Generic pagination params */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Page-based pagination */
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

// ============ Stats ============

export const statsScopeSchema = z.enum(["mine", "group"]);
export const statsTypeSchema = z.enum(["all", "movie", "tv", "anime", "game"]);

export const statsSummaryQuerySchema = z.object({
  scope: statsScopeSchema.default("mine"),
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  type: statsTypeSchema.default("all"),
  limit: z.coerce.number().int().min(1).max(5000).default(5000),
});

export type StatsSummaryQuery = z.infer<typeof statsSummaryQuerySchema>;

// ============ Groups ============

export const groupRoleSchema = z.enum(["admin", "member"]);

/** Create invite body */
export const createInviteBodySchema = z.object({
  group_id: uuidSchema,
  expires_in_hours: z.number().int().min(1).max(720).optional().default(24), // 1h to 30d
  max_uses: z.number().int().min(1).max(100).optional().default(10),
  invite_role: groupRoleSchema.optional().default("member"),
});

export type CreateInviteBody = z.infer<typeof createInviteBodySchema>;

/** Redeem invite body */
export const redeemInviteBodySchema = z.object({
  code: z.string().min(1, "Invite code is required").max(100),
});

export type RedeemInviteBody = z.infer<typeof redeemInviteBodySchema>;

/** Revoke invite body */
export const revokeInviteBodySchema = z.object({
  invite_id: uuidSchema,
});

export type RevokeInviteBody = z.infer<typeof revokeInviteBodySchema>;

/** Set member role body */
export const setMemberRoleBodySchema = z.object({
  group_id: uuidSchema,
  member_id: uuidSchema,
  role: groupRoleSchema,
});

export type SetMemberRoleBody = z.infer<typeof setMemberRoleBodySchema>;

/** Remove member body */
export const removeMemberBodySchema = z.object({
  group_id: uuidSchema,
  member_id: uuidSchema,
});

export type RemoveMemberBody = z.infer<typeof removeMemberBodySchema>;

/** Leave group body */
export const leaveGroupBodySchema = z.object({
  group_id: uuidSchema,
});

export type LeaveGroupBody = z.infer<typeof leaveGroupBodySchema>;

/** Update group name body */
export const updateGroupNameBodySchema = z.object({
  group_id: uuidSchema,
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
});

export type UpdateGroupNameBody = z.infer<typeof updateGroupNameBodySchema>;

/** Group members query */
export const groupMembersQuerySchema = z.object({
  group_id: uuidSchema,
});

// ============ Lists ============

/** Create list body */
export const createListBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).optional(),
});

export type CreateListBody = z.infer<typeof createListBodySchema>;

/** Update list body */
export const updateListBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateListBody = z.infer<typeof updateListBodySchema>;

/** Add item to list body */
export const addListItemBodySchema = z.object({
  item_type: z.enum(["movie", "tv", "anime", "game"]),
  provider: z.enum(["tmdb", "rawg"]),
  external_id: z.string().min(1),
  title: z.string().optional(),
  poster_path: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

export type AddListItemBody = z.infer<typeof addListItemBodySchema>;

/** Reorder list items body */
export const reorderListItemsBodySchema = z.object({
  positions: z.array(z.object({
    item_id: uuidSchema,
    position: z.number().int().min(0),
  })).min(1),
});

export type ReorderListItemsBody = z.infer<typeof reorderListItemsBodySchema>;

// ============ Library ============

export const libraryEntryStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "dropped",
]);

export const libraryProviderSchema = z.enum(["tmdb", "rawg"]);
export const libraryTypeSchema = z.enum(["movie", "tv", "anime", "game"]);

/** Get library entry query */
export const getLibraryEntryQuerySchema = z.object({
  type: libraryTypeSchema,
  provider: libraryProviderSchema,
  externalId: z.string().min(1),
});

export type GetLibraryEntryQuery = z.infer<typeof getLibraryEntryQuerySchema>;

/** Create library entry body */
export const createLibraryEntryBodySchema = z.object({
  type: libraryTypeSchema,
  provider: libraryProviderSchema,
  external_id: z.string().min(1),
  title: z.string().max(500).optional(),
  poster_url: z.string().max(500).optional(),
  status: libraryEntryStatusSchema.optional(),
  rating: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(2000).optional(),
  is_favorite: z.boolean().optional(),
  group_id: uuidSchema.optional(),
});

export type CreateLibraryEntryBody = z.infer<typeof createLibraryEntryBodySchema>;

/** Update library entry body */
export const updateLibraryEntryBodySchema = z.object({
  status: libraryEntryStatusSchema.optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_favorite: z.boolean().optional(),
});

export type UpdateLibraryEntryBody = z.infer<typeof updateLibraryEntryBodySchema>;

/** Library list query (advanced filters) */
export const libraryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  // Multi-status support: comma-separated or single value
  status: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const statuses = val.split(",").map(s => s.trim()).filter(Boolean);
    return statuses.length > 0 ? statuses : undefined;
  }),
  type: libraryTypeSchema.optional(),
  provider: libraryProviderSchema.optional(),
  scope: z.enum(["mine", "group"]).default("mine"),
  favorite: z.enum(["true", "false"]).optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
  unrated: z.enum(["true"]).optional().transform(v => v === "true"),
  q: z.string().max(200).optional(),
  sort: z.enum(["recent", "rating"]).default("recent"),
});

export type LibraryListQuery = z.infer<typeof libraryListQuerySchema>;

/** Bulk action body for library entries */
export const bulkActionBodySchema = z.object({
  ids: z.array(uuidSchema).min(1, "At least one ID required").max(100, "Maximum 100 items per batch"),
  action: z.enum(["set_status", "set_favorite", "delete"]),
  value: z.union([
    libraryEntryStatusSchema, // for set_status
    z.boolean(), // for set_favorite
  ]).optional(),
}).refine(
  (data) => {
    if (data.action === "set_status") return data.value !== undefined && typeof data.value === "string";
    if (data.action === "set_favorite") return data.value !== undefined && typeof data.value === "boolean";
    return true; // delete doesn't require value
  },
  { message: "Value required for set_status (status string) or set_favorite (boolean)" }
);

export type BulkActionBody = z.infer<typeof bulkActionBodySchema>;

// ============ Catalog ============

export const catalogTypeSchema = z.enum(["movie", "tv", "anime", "game"]);
export const catalogProviderSchema = z.enum(["tmdb", "rawg"]);

/** Catalog search query */
export const catalogSearchQuerySchema = z.object({
  type: catalogTypeSchema,
  q: z.string().min(1, "Query is required").max(200),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type CatalogSearchQuery = z.infer<typeof catalogSearchQuerySchema>;

/** Catalog item query */
export const catalogItemQuerySchema = z.object({
  type: catalogTypeSchema,
  provider: catalogProviderSchema,
  externalId: z.string().min(1, "External ID is required"),
});

export type CatalogItemQuery = z.infer<typeof catalogItemQuerySchema>;

// ============ Profile ============

/** Update profile body */
export const updateProfileBodySchema = z.object({
  display_name: z.string().trim().max(100, "Display name too long").nullable().optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

// ============ Activity ============

/** Activity query */
export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;

// ============ Helper ============

/**
 * Parse search params into an object suitable for Zod parsing
 */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/**
 * Validate query params with a Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  params: URLSearchParams
) {
  return schema.safeParse(searchParamsToObject(params));
}

/**
 * Validate request body with a Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
) {
  return schema.safeParse(body);
}

/**
 * Format Zod errors into a user-friendly object
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}
