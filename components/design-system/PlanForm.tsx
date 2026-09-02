"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "./Field";
import { Button } from "./Button";
import { validatePlanFields } from "./form-validation";
import type { PlanPayload } from "../../lib/api/client";

const DEFAULT_DRAFT: PlanPayload = {
  name: "",
  monthly_price: 0,
  annual_price: null,
  publish_quota: 0,
};

export interface PlanFormProps {
  initialValues?: Partial<PlanPayload>;
  onSubmit: (values: PlanPayload) => void;
  submitLabel?: string;
}

/**
 * design-system-admin.md §5.8 — field set from api's CreatePlanRequest/
 * UpdatePlanRequest (AdminV1/PlanController). publish_quota is required
 * (see form-validation.ts's validatePlanFields docblock — the "unlimited"
 * domain concept isn't reachable through this endpoint yet).
 */
export function PlanForm({ initialValues, onSubmit, submitLabel = "Salvar" }: PlanFormProps) {
  const [values, setValues] = useState<PlanPayload>({ ...DEFAULT_DRAFT, ...initialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePlanFields(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        id="plan-name"
        label="Nome"
        value={values.name}
        error={errors.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      <TextField
        id="plan-monthly-price"
        label="Preço mensal"
        type="number"
        step="0.01"
        value={values.monthly_price}
        error={errors.monthly_price}
        onChange={(e) => setValues({ ...values, monthly_price: Number(e.target.value) })}
      />
      <TextField
        id="plan-annual-price"
        label="Preço anual (opcional)"
        type="number"
        step="0.01"
        value={values.annual_price ?? ""}
        error={errors.annual_price}
        onChange={(e) =>
          setValues({ ...values, annual_price: e.target.value ? Number(e.target.value) : null })
        }
      />
      <TextField
        id="plan-publish-quota"
        label="Cota de publicações mensais"
        type="number"
        value={values.publish_quota ?? ""}
        error={errors.publish_quota}
        onChange={(e) =>
          setValues({ ...values, publish_quota: e.target.value ? Number(e.target.value) : null })
        }
      />
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
