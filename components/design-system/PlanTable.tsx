import { DataTable } from "./DataTable";
import { StatusPill } from "./StatusPill";
import type { Plan } from "../../lib/api/types";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface PlanTableProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDeactivate: (plan: Plan) => void;
}

/**
 * design-system-admin.md §5.6 — read-only Super Admin view of every plan
 * (active + inactive), reusing DataTable/StatusPill per §1.2's status-color
 * convention (active=success, inactive=secondary). "Desativar" only makes
 * sense for an active plan, and DataTable's `actions` prop renders one
 * uniform action set per row — so it's rendered inline in the status
 * column instead, next to the pill, rather than as a DataTable action.
 */
export function PlanTable({ plans, onEdit, onDeactivate }: PlanTableProps) {
  return (
    <DataTable<Plan>
      columns={[
        { key: "name", header: "Nome", render: (plan) => plan.name },
        { key: "monthly_price", header: "Preço mensal", render: (plan) => formatCurrency(plan.monthly_price) },
        {
          key: "annual_price",
          header: "Preço anual",
          render: (plan) => (plan.annual_price === null ? "—" : formatCurrency(plan.annual_price)),
        },
        {
          key: "publish_quota",
          header: "Cota de publicações",
          render: (plan) => (plan.publish_quota === null ? "Ilimitado" : String(plan.publish_quota)),
        },
        {
          key: "status",
          header: "Status",
          render: (plan) => (
            <div className="flex items-center gap-2">
              <StatusPill status={plan.is_active ? "active" : "inactive"} />
              {plan.is_active && (
                <button
                  type="button"
                  onClick={() => onDeactivate(plan)}
                  className="rounded-admin-default px-2 py-1 text-xs font-medium text-admin-danger hover:bg-white/5"
                >
                  Desativar
                </button>
              )}
            </div>
          ),
        },
      ]}
      rows={plans}
      rowKey={(plan) => plan.id}
      actions={[{ label: "Editar", onClick: onEdit }]}
      emptyMessage="Nenhum plano cadastrado."
    />
  );
}
