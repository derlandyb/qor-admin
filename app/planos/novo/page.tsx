"use client";

/**
 * AT30 — Super Admin create-plan page (MON-13, MON-16).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanForm } from "../../../components/design-system/PlanForm";
import { usePlans } from "../../../hooks/useBilling";
import type { PlanPayload } from "../../../lib/api/client";

export default function NewPlanPage() {
  const router = useRouter();
  const { create } = usePlans();
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: PlanPayload) {
    setFormError(null);
    try {
      await create(values);
      router.push("/planos");
    } catch {
      setFormError("Erro ao criar o plano.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Novo Plano</h1>

      {formError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {formError}
        </p>
      )}

      <PlanForm onSubmit={handleSubmit} submitLabel="Criar Plano" />
    </div>
  );
}
