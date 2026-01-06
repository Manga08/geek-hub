import { describe, expect, it } from "vitest";

import { sanitizeNextPath } from "@/lib/auth/redirect";

describe("sanitizeNextPath", () => {
  it("returns root for null", () => {
    expect(sanitizeNextPath(null)).toBe("/");
  });

  it("returns root for empty string", () => {
    expect(sanitizeNextPath("" as string)).toBe("/");
  });

  it("blocks http scheme", () => {
    expect(sanitizeNextPath("http://evil.com")).toBe("/");
  });

  it("blocks protocol-relative", () => {
    expect(sanitizeNextPath("//evil.com")).toBe("/");
  });

  it("allows internal absolute path", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
  });

  it("allows internal path with query", () => {
    expect(sanitizeNextPath("/auth/callback?next=/")).toBe("/auth/callback?next=/");
  });
});
