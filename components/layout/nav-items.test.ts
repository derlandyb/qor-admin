import { describe, expect, test } from "vitest";
import { navItemsForRole } from "./nav-items";

describe("navItemsForRole", () => {
  test("GIVEN a Super Admin role WHEN nav items are resolved THEN it sees both approval queues but not Meus Eventos", () => {
    const labels = navItemsForRole("super_admin").map((item) => item.label);
    expect(labels).toContain("Aprovação de Contas");
    expect(labels).toContain("Aprovação de Eventos");
    expect(labels).not.toContain("Meus Eventos");
  });

  test("GIVEN a Venue Admin role WHEN nav items are resolved THEN it sees Meus Eventos but no approval queues", () => {
    const labels = navItemsForRole("venue_admin").map((item) => item.label);
    expect(labels).toContain("Meus Eventos");
    expect(labels).not.toContain("Aprovação de Contas");
    expect(labels).not.toContain("Aprovação de Eventos");
  });

  test("GIVEN a Promoter role WHEN nav items are resolved THEN it sees the same scope as Venue Admin", () => {
    const labels = navItemsForRole("promoter").map((item) => item.label);
    expect(labels).toContain("Meus Eventos");
    expect(labels).not.toContain("Aprovação de Contas");
  });

  test("GIVEN any role WHEN nav items are resolved THEN Dashboard is always visible", () => {
    for (const role of ["super_admin", "venue_admin", "promoter"] as const) {
      expect(navItemsForRole(role).map((item) => item.label)).toContain("Dashboard");
    }
  });
});
