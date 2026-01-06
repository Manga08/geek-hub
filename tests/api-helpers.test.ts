/**
 * Tests for API response helpers and pagination utilities
 */
import { describe, expect, it } from "vitest";
import {
  ok,
  fail,
  badRequest,
  unauthenticated,
  forbidden,
  notFound,
  conflict,
  internal,
  clamp,
  parseLimit,
  parseOffset,
  parseYear,
  PAGINATION,
} from "@/lib/api";

describe("API Response Helpers", () => {
  describe("ok()", () => {
    it("returns success response with data", async () => {
      const response = ok({ foo: "bar" });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual({ ok: true, data: { foo: "bar" } });
    });

    it("returns success response with null data", async () => {
      const response = ok();
      const body = await response.json();
      expect(body).toEqual({ ok: true, data: null });
    });

    it("respects custom status code", async () => {
      const response = ok({ id: 1 }, { status: 201 });
      expect(response.status).toBe(201);
    });
  });

  describe("fail()", () => {
    it("returns error response with all fields", async () => {
      const response = fail("BAD_REQUEST", "Invalid input", 400, { field: "email" });
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body).toEqual({
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid input",
        details: { field: "email" },
      });
    });

    it("omits details when not provided", async () => {
      const response = fail("INTERNAL", "Server error", 500);
      const body = await response.json();
      expect(body).not.toHaveProperty("details");
    });
  });

  describe("Shorthand helpers", () => {
    it("badRequest returns 400", async () => {
      const response = badRequest("Bad input");
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("unauthenticated returns 401", async () => {
      const response = unauthenticated();
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.code).toBe("UNAUTHENTICATED");
    });

    it("forbidden returns 403", async () => {
      const response = forbidden();
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.code).toBe("FORBIDDEN");
    });

    it("notFound returns 404", async () => {
      const response = notFound();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.code).toBe("NOT_FOUND");
    });

    it("conflict returns 409", async () => {
      const response = conflict("Already exists");
      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.code).toBe("CONFLICT");
    });

    it("internal returns 500", async () => {
      const response = internal();
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.code).toBe("INTERNAL");
    });
  });
});

describe("Pagination Utilities", () => {
  describe("clamp()", () => {
    it("returns value when within range", () => {
      expect(clamp(50, 1, 100)).toBe(50);
    });

    it("returns min when value below", () => {
      expect(clamp(-5, 1, 100)).toBe(1);
    });

    it("returns max when value above", () => {
      expect(clamp(150, 1, 100)).toBe(100);
    });
  });

  describe("parseLimit()", () => {
    it("returns default for null", () => {
      expect(parseLimit(null)).toBe(PAGINATION.DEFAULT_LIMIT);
    });

    it("returns default for invalid string", () => {
      expect(parseLimit("abc")).toBe(PAGINATION.DEFAULT_LIMIT);
    });

    it("clamps to min", () => {
      expect(parseLimit("0")).toBe(PAGINATION.MIN_LIMIT);
    });

    it("clamps to max", () => {
      expect(parseLimit("999")).toBe(PAGINATION.MAX_LIMIT);
    });

    it("parses valid limit", () => {
      expect(parseLimit("50")).toBe(50);
    });

    it("respects custom max", () => {
      expect(parseLimit("100", 20, 50)).toBe(50);
    });
  });

  describe("parseOffset()", () => {
    it("returns 0 for null", () => {
      expect(parseOffset(null)).toBe(0);
    });

    it("returns 0 for negative", () => {
      expect(parseOffset("-5")).toBe(0);
    });

    it("parses valid offset", () => {
      expect(parseOffset("100")).toBe(100);
    });
  });

  describe("parseYear()", () => {
    it("returns current year for null", () => {
      const result = parseYear(null);
      expect(result).toBe(new Date().getFullYear());
    });

    it("returns null for out of range", () => {
      expect(parseYear("1800")).toBe(null);
      expect(parseYear("2500")).toBe(null);
    });

    it("returns null for invalid", () => {
      expect(parseYear("abc")).toBe(null);
    });

    it("parses valid year", () => {
      expect(parseYear("2024")).toBe(2024);
    });
  });
});
