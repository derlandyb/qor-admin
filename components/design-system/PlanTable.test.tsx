import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanTable } from "./PlanTable";
import type { Plan } from "../../lib/api/types";

function makePlan(overrides?: Partial<Plan>): Plan {
  return {
    id: 1,
    name: "Gratuito",
    monthly_price: 0,
    annual_price: null,
    publish_quota: 5,
    is_active: true,
    is_default_free: true,
    ...overrides,
  };
}

describe("PlanTable", () => {
  test("GIVEN plans WHEN it renders THEN it shows name/price/quota/status columns", () => {
    render(<PlanTable plans={[makePlan()]} onEdit={vi.fn()} onDeactivate={vi.fn()} />);

    expect(screen.getByText("Gratuito")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  test("GIVEN a plan with a null publish_quota WHEN it renders THEN it shows Ilimitado", () => {
    render(
      <PlanTable
        plans={[makePlan({ publish_quota: null })]}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("Ilimitado")).toBeInTheDocument();
  });

  test("GIVEN an inactive plan WHEN it renders THEN it shows the Inativo pill and no Desativar action", () => {
    render(
      <PlanTable
        plans={[makePlan({ is_active: false })]}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar" })).not.toBeInTheDocument();
  });

  test("GIVEN an active plan WHEN Desativar is clicked THEN onDeactivate fires with that plan", async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    render(<PlanTable plans={[makePlan()]} onEdit={vi.fn()} onDeactivate={onDeactivate} />);

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    expect(onDeactivate).toHaveBeenCalledWith(makePlan());
  });

  test("GIVEN a plan WHEN Editar is clicked THEN onEdit fires with that plan", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<PlanTable plans={[makePlan()]} onEdit={onEdit} onDeactivate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(onEdit).toHaveBeenCalledWith(makePlan());
  });
});
