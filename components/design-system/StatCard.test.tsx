import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  test("GIVEN a positive trend WHEN it renders THEN the chip uses the success color and an upward arrow", () => {
    render(<StatCard value={128} label="Contas pendentes" trend={3.5} />);

    expect(screen.getByText("128")).toBeInTheDocument();
    const chip = screen.getByText("3.5%");
    expect(chip).toHaveClass("bg-admin-success");
  });

  test("GIVEN a negative trend WHEN it renders THEN the chip uses the danger color and shows the absolute value", () => {
    render(<StatCard value={4} label="Eventos rejeitados" trend={-2.4} />);

    const chip = screen.getByText("2.4%");
    expect(chip).toHaveClass("bg-admin-danger");
  });

  test("GIVEN no trend WHEN it renders THEN no trend chip appears", () => {
    render(<StatCard value={10} label="Publicações usadas" />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
