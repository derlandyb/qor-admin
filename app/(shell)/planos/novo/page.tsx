"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PlanForm } from "@/components/design-system/PlanForm";
import { usePlans } from "@/hooks/useBilling";
import type { PlanPayload } from "@/lib/api/types";

/**
 * AT30 — Super Admin plan creation. `usePlans().create` never throws; on
 * failure it sets `error` (pt-BR) and resolves `undefined`, so we only
 * redirect when a `Plan` actually comes back.
 */
export default function NovoPlanoPage() {
  const router = useRouter();
  const { create, error } = usePlans();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(payload: PlanPayload) {
    setIsSubmitting(true);
    try {
      const created = await create(payload);
      if (created) {
        router.push("/planos");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Novo Plano</h1>
      <PlanForm mode="create" onSubmit={handleCreate} isSubmitting={isSubmitting} serverError={error} />
    </div>
  );
}
