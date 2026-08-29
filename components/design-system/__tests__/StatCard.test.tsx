import { render, screen } from "@testing-library/react";

import { StatCard } from "../StatCard";

describe("StatCard", () => {
  test("GIVEN a positive trend WHEN StatCard renders THEN the trend chip uses the success color", () => {
    render(<StatCard value={128} label="Contas pendentes" trend={{ value: "+3.5%", direction: "up" }} />);

    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Contas pendentes")).toBeInTheDocument();
    expect(screen.getByText("+3.5%")).toHaveClass("bg-admin-success");
  });

  test("GIVEN a negative trend WHEN StatCard renders THEN the trend chip uses the danger color", () => {
    render(<StatCard value={12} label="Eventos cancelados" trend={{ value: "-2.4%", direction: "down" }} />);

    expect(screen.getByText("-2.4%")).toHaveClass("bg-admin-danger");
  });

  test("GIVEN no trend WHEN StatCard renders THEN no trend chip is shown", () => {
    render(<StatCard value={5} label="Sem tendência" />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
