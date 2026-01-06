import { describe, it, expect } from "vitest";
import { validatePassword } from "@/features/auth/validation";

describe("validatePassword", () => {
  it("returns error when password is empty", () => {
    const result = validatePassword("", "");
    expect(result).toBe("La contraseña debe tener al menos 6 caracteres");
  });

  it("returns error when password is too short", () => {
    const result = validatePassword("12345", "12345");
    expect(result).toBe("La contraseña debe tener al menos 6 caracteres");
  });

  it("returns error when passwords do not match", () => {
    const result = validatePassword("password123", "password456");
    expect(result).toBe("Las contraseñas no coinciden");
  });

  it("returns null when passwords are valid and match", () => {
    const result = validatePassword("password123", "password123");
    expect(result).toBeNull();
  });

  it("accepts exactly 6 characters", () => {
    const result = validatePassword("123456", "123456");
    expect(result).toBeNull();
  });
});
