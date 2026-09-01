import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  test.each([
    ["pending_approval", "bg-admin-warning", "Pendente"],
    ["pending_review", "bg-admin-warning", "Em Revisão"],
    ["published", "bg-admin-success", "Publicado"],
    ["approved", "bg-admin-success", "Aprovado"],
    ["rejected", "bg-admin-danger", "Rejeitado"],
    ["suspended", "bg-admin-danger", "Suspenso"],
    ["cancelled", "bg-admin-danger", "Cancelado"],
    ["ended", "bg-admin-info", "Encerrado"],
  ] as const)(
    "GIVEN status %s WHEN it renders THEN it uses %s and shows the label %s",
    (status, expectedClass, expectedLabel) => {
      render(<StatusPill status={status} />);
      const pill = screen.getByText(expectedLabel);
      expect(pill).toHaveClass(expectedClass);
    },
  );
});
