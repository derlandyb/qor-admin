import type { ReactNode } from "react";

import type { Plan } from "@/lib/api/types";

import { Badge } from "./Badge";
import { Column, DataTable } from "./DataTable";

export interface PlanTableProps {
  plans: Plan[];
  actions?: (plan: Plan) => ReactNode;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number | null): string {
  return value === null ? "—" : CURRENCY_FORMATTER.format(value);
}

/**
 * Read-only table of all plans (active + inactive), Super Admin view
 * (.specs/tasks/admin.md AT28). Status color follows design-system-admin.md
 * §1.2: active = success green, inactive = secondary gray. Exactly one
 * plan is always the default free plan (ARCHITECTURE.md §4) — it gets a
 * small "Padrão" indicator.
 */
export function PlanTable({ plans, actions }: PlanTableProps) {
  const columns: Column<Plan>[] = [
    {
      header: "Nome",
      render: (plan) => (
        <span className="flex items-center gap-2">
          {plan.name}
          {plan.is_default_free ? <Badge color="info">Padrão</Badge> : null}
        </span>
      ),
    },
    {
      header: "Preço mensal",
      render: (plan) => formatCurrency(plan.monthly_price),
    },
    {
      header: "Preço anual",
      render: (plan) => formatCurrency(plan.annual_price),
    },
    {
      header: "Cota de publicações",
      render: (plan) => (plan.publish_quota === null ? "—" : plan.publish_quota),
    },
    {
      header: "Status",
      render: (plan) => (
        <Badge color={plan.is_active ? "success" : "secondary"}>
          {plan.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return <DataTable columns={columns} rows={plans} rowKey={(plan) => plan.id} actions={actions} />;
}
