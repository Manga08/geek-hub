/**
 * GroupSwitcher navigation test (node environment)
 *
 * Verifies that the "Gestionar grupo" link points to /settings/group
 * by inspecting the source code directly (no DOM rendering needed).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("GroupSwitcher navigation", () => {
  const componentPath = resolve(
    __dirname,
    "../src/features/groups/components/group-switcher.tsx"
  );
  const source = readFileSync(componentPath, "utf-8");

  it("contains Link to /settings/group for 'Gestionar grupo'", () => {
    // Verify the Link href is correct
    expect(source).toContain('href="/settings/group"');
    // Verify the label text exists
    expect(source).toContain("Gestionar grupo");
  });

  it("does not import ManageGroupDialog", () => {
    expect(source).not.toContain("ManageGroupDialog");
  });

  it("exports GroupSwitcher from the components barrel", async () => {
    const { GroupSwitcher } = await import(
      "@/features/groups/components"
    );
    expect(GroupSwitcher).toBeDefined();
    expect(typeof GroupSwitcher).toBe("function");
  });
});
