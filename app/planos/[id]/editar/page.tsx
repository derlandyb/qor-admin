"use client";

/**
 * AT30 — Super Admin edit-plan page (MON-13–MON-16). Same Next 16 async
 * `params` resolution pattern as app/eventos/[id]/editar/page.tsx (see that
 * file's docblock for why a plain useEffect/useState is used instead of
 * `use(params)`). No single-plan GET endpoint exists — the plan to edit is
 * found in usePlans().plans by id, same as the event-edit page does for
 * useEvents().events.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanForm } from "../../../../components/design-system/PlanForm";
import { usePlans } from "../../../../hooks/useBilling";
import type { PlanPayload } from "../../../../lib/api/client";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <p className="text-sm text-admin-text-secondary">Carregando...</p>
    </div>
  );
}

export default function EditPlanPage({ params }: EditPlanPageProps) {
  const router = useRouter();
  const { plans, loading: plansLoading, error, update } = usePlans();
  const [id, setId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    params.then((resolved) => {
      if (active) setId(resolved.id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  const plan = id === null ? undefined : plans.find((p) => String(p.id) === id);

  async function handleSubmit(values: PlanPayload) {
    if (id === null) return;
    setFormError(null);
    try {
      await update(Number(id), values);
      router.push("/planos");
    } catch {
      setFormError("Erro ao salvar o plano.");
    }
  }

  if (id === null || plansLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-sm text-admin-text-secondary">Plano não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Editar Plano</h1>

      {formError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {formError}
        </p>
      )}

      <PlanForm
        initialValues={{
          name: plan.name,
          monthly_price: plan.monthly_price,
          annual_price: plan.annual_price,
          publish_quota: plan.publish_quota,
        }}
        onSubmit={handleSubmit}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}
