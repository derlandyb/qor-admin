"use client";

/**
 * AT30 — Super Admin plan list (MON-13–MON-16). Deactivate flows through
 * the existing DecisionModal for a confirm step, same pattern AT16/AT17
 * use for approve/reject decisions.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/design-system/Button";
import { DecisionModal } from "../../components/design-system/DecisionModal";
import { PlanTable } from "../../components/design-system/PlanTable";
import { usePlans } from "../../hooks/useBilling";
import type { Plan } from "../../lib/api/types";

export default function PlansPage() {
  const router = useRouter();
  const { plans, loading, error, deactivate } = usePlans();
  const [pendingDeactivation, setPendingDeactivation] = useState<Plan | null>(null);

  async function handleConfirmDeactivate() {
    if (!pendingDeactivation) return;
    const plan = pendingDeactivation;
    setPendingDeactivation(null);
    await deactivate(plan.id);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text-primary">Planos</h1>
          <p className="mt-1 text-sm text-admin-text-secondary">
            Gerencie os planos de publicação disponíveis para casas de show e produtoras.
          </p>
        </div>
        <Button onClick={() => router.push("/planos/novo")}>Novo Plano</Button>
      </div>

      {error && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      ) : (
        <PlanTable
          plans={plans}
          onEdit={(plan) => router.push(`/planos/${plan.id}/editar`)}
          onDeactivate={setPendingDeactivation}
        />
      )}

      <DecisionModal
        open={pendingDeactivation !== null}
        title={`Desativar ${pendingDeactivation?.name ?? ""}?`}
        description="Assinantes atuais deste plano não serão afetados; o plano deixa de ficar disponível para novas assinaturas."
        confirmLabel="Desativar"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setPendingDeactivation(null)}
      />
    </div>
  );
}
