import { render, screen, within } from "@testing-library/react";

import type { Plan } from "@/lib/api/types";

import { PlanTable } from "../PlanTable";

const plans: Plan[] = [
  {
    id: 1,
    name: "Grátis",
    monthly_price: 0,
    annual_price: null,
    publish_quota: 2,
    is_active: true,
    is_default_free: true,
  },
  {
    id: 2,
    name: "Pro",
    monthly_price: 49.9,
    annual_price: 499.0,
    publish_quota: null,
    is_active: false,
    is_default_free: false,
  },
];

describe("PlanTable", () => {
  test("GIVEN plans WHEN PlanTable renders THEN it shows one row per plan with formatted currency", () => {
    render(<PlanTable plans={plans} />);

    const rows = screen.getAllByRole("row");
    // header row + 2 data rows
    expect(rows).toHaveLength(3);

    expect(screen.getByText("Grátis")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();

    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 49,90")).toBeInTheDocument();
    expect(screen.getByText("R$ 499,00")).toBeInTheDocument();
  });

  test("GIVEN a plan with null annual_price WHEN PlanTable renders THEN it shows an em dash", () => {
    render(<PlanTable plans={plans} />);

    const rows = screen.getAllByRole("row");
    // Grátis row: null annual_price
    expect(within(rows[1]).getByText("—")).toBeInTheDocument();
    // Pro row: null publish_quota
    expect(within(rows[2]).getByText("—")).toBeInTheDocument();
  });

  test("GIVEN is_active true WHEN PlanTable renders THEN it shows an Ativo success badge", () => {
    render(<PlanTable plans={plans} />);

    const rows = screen.getAllByRole("row");
    const activeRow = rows[1];
    const badge = within(activeRow).getByText("Ativo");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-admin-success");
  });

  test("GIVEN is_active false WHEN PlanTable renders THEN it shows an Inativo secondary badge", () => {
    render(<PlanTable plans={plans} />);

    const rows = screen.getAllByRole("row");
    const inactiveRow = rows[2];
    const badge = within(inactiveRow).getByText("Inativo");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-admin-secondary");
  });

  test("GIVEN is_default_free true WHEN PlanTable renders THEN only the matching row shows the Padrão indicator", () => {
    render(<PlanTable plans={plans} />);

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Padrão")).toBeInTheDocument();
    expect(within(rows[2]).queryByText("Padrão")).not.toBeInTheDocument();
  });

  test("GIVEN an actions renderer WHEN PlanTable renders THEN it is forwarded to DataTable per row", () => {
    render(<PlanTable plans={plans} actions={(plan) => <button type="button">Editar {plan.name}</button>} />);

    expect(screen.getByRole("button", { name: "Editar Grátis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Pro" })).toBeInTheDocument();
  });
});
