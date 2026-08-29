"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PlanForm } from "@/components/design-system/PlanForm";
import { usePlans } from "@/hooks/useBilling";
import type { Plan, PlanPayload } from "@/lib/api/types";

/**
 * `Plan.publish_quota` is `number | null` (a plan can have an unlimited
 * quota), while `PlanForm`'s `initialValues` expects
 * `Partial<PlanPayload>` (`publish_quota: number`, required on create) —
 * `null` just becomes an empty field, same as `undefined`.
 */
function toInitialValues(plan: Plan): Partial<PlanPayload> {
  return {
    name: plan.name,
    monthly_price: plan.monthly_price,
    annual_price: plan.annual_price,
    publish_quota: plan.publish_quota ?? undefined,
  };
}

/**
 * AT30 — Super Admin plan editing. `usePlans` fetches the full plan list
 * on mount, so this page waits for that list to populate before it can
 * find the plan matching the route's `id` — hence the loading and
 * not-found guards below, same pattern as
 * app/(shell)/eventos/[id]/editar/page.tsx.
 */
export default function EditarPlanoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { plans, isLoading, update, error } = usePlans();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planId = Number(params.id);
  const plan = plans.find((candidate) => candidate.id === planId);

  async function handleEdit(payload: PlanPayload) {
    setIsSubmitting(true);
    try {
      const updated = await update(planId, payload);
      if (updated) {
        router.push("/planos");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-admin-text-secondary">Carregando...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p role="alert" className="text-admin-danger">
          Plano não encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Editar Plano</h1>
      <PlanForm
        mode="edit"
        initialValues={toInitialValues(plan)}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
        serverError={error}
      />
    </div>
  );
}
