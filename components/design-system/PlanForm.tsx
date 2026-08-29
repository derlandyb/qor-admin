"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { PlanPayload } from "@/lib/api/types";

/**
 * Shared input styling (design-system-admin.md §5.8) — mirrors
 * RegistrationForm.tsx / EventForm.tsx's tokens so all forms read as one
 * system.
 */
const INPUT_CLASS =
  "w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-input px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary placeholder:text-admin-text-secondary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-admin-text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface FormState {
  name: string;
  monthly_price: string;
  annual_price: string;
  publish_quota: string;
}

function buildInitialState(initialValues?: Partial<PlanPayload>): FormState {
  return {
    name: initialValues?.name ?? "",
    monthly_price:
      initialValues?.monthly_price != null ? String(initialValues.monthly_price) : "",
    annual_price: initialValues?.annual_price != null ? String(initialValues.annual_price) : "",
    publish_quota:
      initialValues?.publish_quota != null ? String(initialValues.publish_quota) : "",
  };
}

type FieldErrors = Partial<
  Record<"name" | "monthly_price" | "annual_price" | "publish_quota", string>
>;

// Mirrors api/src/Http/Requests/Api/AdminV1/CreatePlanRequest.php's
// rules/messages verbatim (name required max:255; monthly_price required
// numeric min:0; annual_price nullable numeric min:0 — never required;
// publish_quota required integer min:0).
function validate(state: FormState): FieldErrors {
  const errors: FieldErrors = {};

  const trimmedName = state.name.trim();
  if (!trimmedName) {
    errors.name = "O nome do plano é obrigatório.";
  } else if (trimmedName.length > 255) {
    errors.name = "O nome do plano não pode ter mais de 255 caracteres.";
  }

  const trimmedMonthlyPrice = state.monthly_price.trim();
  if (!trimmedMonthlyPrice) {
    errors.monthly_price = "O preço mensal é obrigatório.";
  } else if (Number.isNaN(Number(trimmedMonthlyPrice))) {
    errors.monthly_price = "O preço mensal deve ser um número.";
  } else if (Number(trimmedMonthlyPrice) < 0) {
    errors.monthly_price = "O preço mensal não pode ser negativo.";
  }

  const trimmedAnnualPrice = state.annual_price.trim();
  if (trimmedAnnualPrice) {
    if (Number.isNaN(Number(trimmedAnnualPrice))) {
      errors.annual_price = "O preço anual deve ser um número.";
    } else if (Number(trimmedAnnualPrice) < 0) {
      errors.annual_price = "O preço anual não pode ser negativo.";
    }
  }

  const trimmedPublishQuota = state.publish_quota.trim();
  if (!trimmedPublishQuota) {
    errors.publish_quota = "A cota de publicações é obrigatória.";
  } else if (
    Number.isNaN(Number(trimmedPublishQuota)) ||
    !Number.isInteger(Number(trimmedPublishQuota))
  ) {
    errors.publish_quota = "A cota de publicações deve ser um número inteiro.";
  } else if (Number(trimmedPublishQuota) < 0) {
    errors.publish_quota = "A cota de publicações não pode ser negativa.";
  }

  return errors;
}

export interface PlanFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<PlanPayload>;
  onSubmit: (payload: PlanPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function PlanForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: PlanFormProps) {
  const [state, setState] = useState<FormState>(() => buildInitialState(initialValues));
  const [errors, setErrors] = useState<FieldErrors>({});

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setState((previous) => ({ ...previous, [field]: value }));
  }

  function handleTextChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      updateField(field, event.target.value);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validate(state);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    const trimmedAnnualPrice = state.annual_price.trim();

    const payload: PlanPayload = {
      name: state.name.trim(),
      monthly_price: Number(state.monthly_price.trim()),
      annual_price: trimmedAnnualPrice ? Number(trimmedAnnualPrice) : null,
      publish_quota: Number(state.publish_quota.trim()),
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? (
        <p role="alert" className="text-sm text-admin-danger">
          {serverError}
        </p>
      ) : null}

      <Field id="name" label="Nome do plano" error={errors.name}>
        <input
          id="name"
          type="text"
          className={INPUT_CLASS}
          value={state.name}
          onChange={handleTextChange("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
      </Field>

      <Field id="monthly_price" label="Preço mensal" error={errors.monthly_price}>
        <input
          id="monthly_price"
          type="number"
          min={0}
          step="0.01"
          className={INPUT_CLASS}
          value={state.monthly_price}
          onChange={handleTextChange("monthly_price")}
          aria-invalid={Boolean(errors.monthly_price)}
          aria-describedby={errors.monthly_price ? "monthly_price-error" : undefined}
        />
      </Field>

      <Field id="annual_price" label="Preço anual (opcional)" error={errors.annual_price}>
        <input
          id="annual_price"
          type="number"
          min={0}
          step="0.01"
          className={INPUT_CLASS}
          value={state.annual_price}
          onChange={handleTextChange("annual_price")}
          aria-invalid={Boolean(errors.annual_price)}
          aria-describedby={errors.annual_price ? "annual_price-error" : undefined}
        />
      </Field>

      <Field id="publish_quota" label="Cota de publicações" error={errors.publish_quota}>
        <input
          id="publish_quota"
          type="number"
          min={0}
          step="1"
          className={INPUT_CLASS}
          value={state.publish_quota}
          onChange={handleTextChange("publish_quota")}
          aria-invalid={Boolean(errors.publish_quota)}
          aria-describedby={errors.publish_quota ? "publish_quota-error" : undefined}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-admin-button bg-admin-primary px-5 py-2.5 text-sm font-medium text-white transition-[background-color] duration-admin-control ease-admin-control disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : mode === "create" ? "Criar plano" : "Salvar alterações"}
      </button>
    </form>
  );
}
