import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  test("GIVEN a color WHEN it renders THEN it applies the matching semantic fill class", () => {
    render(<Badge color="warning">Novo</Badge>);
    expect(screen.getByText("Novo")).toHaveClass("bg-admin-warning");
  });

  test("GIVEN no color WHEN it renders THEN it defaults to primary", () => {
    render(<Badge>Padrão</Badge>);
    expect(screen.getByText("Padrão")).toHaveClass("bg-admin-primary");
  });
});
