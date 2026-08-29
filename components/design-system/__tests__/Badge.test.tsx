import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";
import type { AdminColor } from "../Button";

const COLORS: AdminColor[] = [
  "primary",
  "secondary",
  "success",
  "danger",
  "warning",
  "info",
  "light",
  "dark",
];

describe("Badge", () => {
  it.each(COLORS)(
    "GIVEN color=%s WHEN rendered THEN it applies the solid background and badge radius classes",
    (color) => {
      render(<Badge color={color}>Status</Badge>);
      const badge = screen.getByText("Status");
      expect(badge.className).toContain(`bg-admin-${color}`);
      expect(badge.className).toContain("rounded-admin-badge");
      expect(badge.className).toContain("px-2");
      expect(badge.className).toContain("py-0.5");
      expect(badge.className).toContain("text-xs");
    },
  );

  it("GIVEN light or secondary color WHEN rendered THEN uses dark text for contrast", () => {
    render(
      <>
        <Badge color="light">Light</Badge>
        <Badge color="secondary">Secondary</Badge>
      </>,
    );
    expect(screen.getByText("Light").className).toContain("text-admin-dark");
    expect(screen.getByText("Secondary").className).toContain(
      "text-admin-dark",
    );
  });
});
