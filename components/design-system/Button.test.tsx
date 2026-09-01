import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  test("GIVEN the default rounded variant WHEN it renders THEN it uses the pill radius and solid primary fill", () => {
    render(<Button>Salvar</Button>);
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toHaveClass("rounded-admin-pill");
    expect(button).toHaveClass("bg-admin-primary");
  });

  test.each([
    ["default", "rounded-admin-default"],
    ["inverse", "rounded-admin-default"],
    ["rounded", "rounded-admin-pill"],
    ["outline", "rounded-admin-default"],
  ] as const)("GIVEN variant %s WHEN it renders THEN it uses radius class %s", (variant, radiusClass) => {
    render(
      <Button variant={variant} color="danger">
        Rejeitar
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Rejeitar" })).toHaveClass(radiusClass);
  });

  test("GIVEN the outline variant WHEN it renders THEN it has a colored border and no solid fill class", () => {
    render(
      <Button variant="outline" color="success">
        Aprovar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Aprovar" });
    expect(button).toHaveClass("border-admin-success");
    expect(button).not.toHaveClass("bg-admin-success");
  });

  test("GIVEN every button WHEN it renders THEN it enforces the 128px min-width token", () => {
    render(<Button>Enviar</Button>);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveClass(
      "min-w-admin-button-min-width",
    );
  });
});
