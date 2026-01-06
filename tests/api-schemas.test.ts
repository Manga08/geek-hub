/**
 * Tests for API Zod schemas
 */
import { describe, expect, it } from "vitest";
import {
  statsSummaryQuerySchema,
  catalogSearchQuerySchema,
  createListBodySchema,
  createLibraryEntryBodySchema,
  updateProfileBodySchema,
  createInviteBodySchema,
  validateQuery,
  validateBody,
  formatZodErrors,
} from "@/lib/api/schemas";

describe("API Schemas", () => {
  describe("statsSummaryQuerySchema", () => {
    it("parses valid query with defaults", () => {
      const result = statsSummaryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scope).toBe("mine");
        expect(result.data.type).toBe("all");
        expect(result.data.year).toBe(new Date().getFullYear());
      }
    });

    it("validates scope enum", () => {
      const result = statsSummaryQuerySchema.safeParse({ scope: "invalid" });
      expect(result.success).toBe(false);
    });

    it("validates type enum", () => {
      const result = statsSummaryQuerySchema.safeParse({ type: "podcast" });
      expect(result.success).toBe(false);
    });

    it("validates year range", () => {
      expect(statsSummaryQuerySchema.safeParse({ year: "1999" }).success).toBe(false);
      expect(statsSummaryQuerySchema.safeParse({ year: "2101" }).success).toBe(false);
      expect(statsSummaryQuerySchema.safeParse({ year: "2024" }).success).toBe(true);
    });

    it("coerces string to number", () => {
      const result = statsSummaryQuerySchema.safeParse({ year: "2024", limit: "100" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2024);
        expect(result.data.limit).toBe(100);
      }
    });
  });

  describe("catalogSearchQuerySchema", () => {
    it("requires type and query", () => {
      expect(catalogSearchQuerySchema.safeParse({}).success).toBe(false);
      expect(catalogSearchQuerySchema.safeParse({ type: "movie" }).success).toBe(false);
      expect(catalogSearchQuerySchema.safeParse({ q: "test" }).success).toBe(false);
    });

    it("validates type enum", () => {
      expect(catalogSearchQuerySchema.safeParse({ type: "book", q: "test" }).success).toBe(false);
      expect(catalogSearchQuerySchema.safeParse({ type: "movie", q: "test" }).success).toBe(true);
    });

    it("applies page default and clamp", () => {
      const result = catalogSearchQuerySchema.safeParse({ type: "game", q: "zelda" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });
  });

  describe("createListBodySchema", () => {
    it("requires name", () => {
      expect(createListBodySchema.safeParse({}).success).toBe(false);
      expect(createListBodySchema.safeParse({ name: "" }).success).toBe(false);
    });

    it("trims name", () => {
      const result = createListBodySchema.safeParse({ name: "  My List  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My List");
      }
    });

    it("validates max length", () => {
      const longName = "a".repeat(101);
      expect(createListBodySchema.safeParse({ name: longName }).success).toBe(false);
    });
  });

  describe("createLibraryEntryBodySchema", () => {
    it("requires type, provider, external_id", () => {
      expect(createLibraryEntryBodySchema.safeParse({}).success).toBe(false);
      expect(createLibraryEntryBodySchema.safeParse({ type: "movie" }).success).toBe(false);
    });

    it("validates rating range", () => {
      expect(createLibraryEntryBodySchema.safeParse({
        type: "movie", provider: "tmdb", external_id: "123", rating: -1,
      }).success).toBe(false);
      expect(createLibraryEntryBodySchema.safeParse({
        type: "movie", provider: "tmdb", external_id: "123", rating: 11,
      }).success).toBe(false);
      expect(createLibraryEntryBodySchema.safeParse({
        type: "movie", provider: "tmdb", external_id: "123", rating: 8,
      }).success).toBe(true);
    });
  });

  describe("updateProfileBodySchema", () => {
    it("allows empty object", () => {
      expect(updateProfileBodySchema.safeParse({}).success).toBe(true);
    });

    it("validates display_name max length", () => {
      const longName = "a".repeat(101);
      expect(updateProfileBodySchema.safeParse({ display_name: longName }).success).toBe(false);
    });

    it("allows null display_name", () => {
      const result = updateProfileBodySchema.safeParse({ display_name: null });
      expect(result.success).toBe(true);
    });
  });

  describe("createInviteBodySchema", () => {
    it("requires group_id", () => {
      expect(createInviteBodySchema.safeParse({}).success).toBe(false);
    });

    it("validates group_id as UUID", () => {
      expect(createInviteBodySchema.safeParse({ group_id: "not-a-uuid" }).success).toBe(false);
      expect(createInviteBodySchema.safeParse({
        group_id: "550e8400-e29b-41d4-a716-446655440000",
      }).success).toBe(true);
    });

    it("applies defaults for optional fields", () => {
      const result = createInviteBodySchema.safeParse({
        group_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expires_in_hours).toBe(24);
        expect(result.data.max_uses).toBe(10);
        expect(result.data.invite_role).toBe("member");
      }
    });

    it("validates expires_in_hours range", () => {
      expect(createInviteBodySchema.safeParse({
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        expires_in_hours: 0,
      }).success).toBe(false);
      expect(createInviteBodySchema.safeParse({
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        expires_in_hours: 721,
      }).success).toBe(false);
    });
  });

  describe("Helper functions", () => {
    it("validateQuery parses URLSearchParams", () => {
      const params = new URLSearchParams("scope=group&year=2024");
      const result = validateQuery(statsSummaryQuerySchema, params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scope).toBe("group");
        expect(result.data.year).toBe(2024);
      }
    });

    it("validateBody parses object", () => {
      const body = { name: "Test List" };
      const result = validateBody(createListBodySchema, body);
      expect(result.success).toBe(true);
    });

    it("formatZodErrors formats errors by path", () => {
      const result = createLibraryEntryBodySchema.safeParse({ rating: 15 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted).toHaveProperty("type");
        expect(formatted).toHaveProperty("provider");
        expect(formatted).toHaveProperty("external_id");
        expect(formatted).toHaveProperty("rating");
      }
    });
  });
});
