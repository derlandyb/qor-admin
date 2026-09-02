import { describe, expect, test } from "vitest";
import { navItemsForRole } from "./nav-items";

describe("navItemsForRole", () => {
  test("GIVEN role super_admin THEN it includes Planos but not Assinatura", () => {
    const hrefs = navItemsForRole("super_admin").map((item) => item.href);
    expect(hrefs).toContain("/planos");
    expect(hrefs).not.toContain("/assinatura");
  });

  test.each(["venue_admin", "promoter"] as const)(
    "GIVEN role %s THEN it includes Assinatura but not Planos",
    (role) => {
      const hrefs = navItemsForRole(role).map((item) => item.href);
      expect(hrefs).toContain("/assinatura");
      expect(hrefs).not.toContain("/planos");
    },
  );
});
