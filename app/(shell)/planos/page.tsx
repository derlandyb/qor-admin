"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/design-system/Button";
import { DecisionModal } from "@/components/design-system/DecisionModal";
import { PlanTable } from "@/components/design-system/PlanTable";
import { usePlans } from "@/hooks/useBilling";
import type { Plan } from "@/lib/api/types";

/**
 * AT30 — Super Admin plan list. Server-side enforcement (PlanPolicy /
 * guard.super-admin) already gates this route on the API side, mirroring
 * how app/(shell)/aprovacoes/** pages don't self-gate either: a
 * non-Super-Admin simply sees the generic ApiError message surfaced by
 * usePlans().
 */
export default function PlanosPage() {
  const { plans, isLoading, error, deactivate } = usePlans();
  const [pendingDeactivation, setPendingDeactivation] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openDeactivation(plan: Plan) {
    setPendingDeactivation(plan);
  }

  function closeDeactivation() {
    setPendingDeactivation(null);
  }

  async function handleConfirm() {
    if (!pendingDeactivation) return;

    setIsSubmitting(true);
    try {
      await deactivate(pendingDeactivation.id);
      setPendingDeactivation(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-admin-h3 font-medium text-admin-text-primary">Planos</h1>
        <Link href="/planos/novo">
          <Button type="button" color="primary">
            + Novo Plano
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-admin-text-secondary">Carregando...</p>
      ) : error ? (
        <p role="alert" className="text-admin-danger">
          {error}
        </p>
      ) : (
        <PlanTable
          plans={plans}
          actions={(plan) => (
            <div className="flex flex-wrap gap-2">
              <Link href={`/planos/${plan.id}/editar`}>
                <Button type="button" color="secondary">
                  Editar
                </Button>
              </Link>
              {plan.is_active ? (
                <Button type="button" color="danger" onClick={() => openDeactivation(plan)}>
                  Desativar
                </Button>
              ) : null}
            </div>
          )}
        />
      )}

      <DecisionModal
        open={pendingDeactivation !== null}
        title="Desativar plano"
        onConfirm={handleConfirm}
        onCancel={closeDeactivation}
        confirmLabel="Desativar"
        showReasonField={false}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
