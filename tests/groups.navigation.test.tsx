// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the hooks before importing the component
vi.mock("@/features/groups/hooks", () => ({
  useCurrentGroup: () => ({
    data: { group: { id: "group-1", name: "Test Group" } },
    isLoading: false,
  }),
  useGroupsList: () => ({
    data: [{ id: "group-1", name: "Test Group" }],
    isLoading: false,
  }),
  useSetCurrentGroup: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock next/link to render as a regular anchor
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { GroupSwitcher } from "@/features/groups/components";

describe("GroupSwitcher navigation", () => {
  it("renders the 'Gestionar grupo' link pointing to /settings/group", async () => {
    const user = userEvent.setup();
    
    render(<GroupSwitcher />);

    // Open the dropdown by clicking the trigger button
    const trigger = screen.getByRole("button");
    await user.click(trigger);

    // Find the "Gestionar grupo" link
    const manageLink = screen.getByRole("link", { name: /gestionar grupo/i });
    
    // Verify it points to the correct route
    expect(manageLink).toHaveAttribute("href", "/settings/group");
  });

  it("displays the current group name", () => {
    render(<GroupSwitcher />);
    
    expect(screen.getByText("Test Group")).toBeInTheDocument();
  });
});
