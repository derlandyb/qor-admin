"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { City, CityLabel } from "@/lib/enums";
import type { RegisterPromoterPayload, RegisterVenuePayload } from "@/lib/api/types";

/**
 * Shared input/select/checkbox styling (design-system-admin.md §5.8): dark
 * fill, 1px subtle border, per-control radius token, 150ms ease-in-out
 * focus transition on border-color/box-shadow. Checkboxes are instant (no
 * transition) per the a11y-clarity convention — do not add a transition
 * utility to CHECKBOX_CLASS.
 */
const INPUT_CLASS =
  "w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-input px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary placeholder:text-admin-text-secondary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]";

const SELECT_CLASS =
  "w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-select px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]";

const CHECKBOX_CLASS =
  "h-4 w-4 rounded-admin-checkbox border border-admin-border-subtle bg-white text-admin-primary";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

/**
 * Shared label + control + field-specific error markup, reused for every
 * field in both the venue and promoter variants so it isn't duplicated
 * twice (AT9 "Where" note).
 */
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
  description: string;
  address: string;
  city: City | "";
  contact_phone: string;
  contact_email: string;
  instagram: string;
  tiktok: string;
  registration_email: string;
  password: string;
  terms_accepted: boolean;
}

const INITIAL_STATE: FormState = {
  name: "",
  description: "",
  address: "",
  city: "",
  contact_phone: "",
  contact_email: "",
  instagram: "",
  tiktok: "",
  registration_email: "",
  password: "",
  terms_accepted: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(kind: "venue" | "promoter", state: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!state.name.trim()) {
    errors.name = "O nome é obrigatório.";
  }

  if (kind === "venue") {
    if (!state.description.trim()) {
      errors.description = "A descrição é obrigatória.";
    }
    if (!state.address.trim()) {
      errors.address = "O endereço é obrigatório.";
    }
    if (!state.city) {
      errors.city = "A cidade é obrigatória.";
    }
  }

  if (!state.contact_phone.trim()) {
    errors.contact_phone = "O telefone de contato é obrigatório.";
  }

  if (!state.contact_email.trim()) {
    errors.contact_email = "O e-mail de contato é obrigatório.";
  } else if (!EMAIL_PATTERN.test(state.contact_email)) {
    errors.contact_email = "E-mail de contato inválido.";
  }

  if (!state.registration_email.trim()) {
    errors.registration_email = "O e-mail de cadastro é obrigatório.";
  } else if (!EMAIL_PATTERN.test(state.registration_email)) {
    errors.registration_email = "E-mail de cadastro inválido.";
  }

  // Mirrors qor-api's Domain\User\PasswordPolicy (qor.auth.password_rules:
  // min length 8, mixed case, at least one number) — same order/wording as
  // its pt-BR messages, since the Form Request itself only checks
  // required/string and this composite check happens in the domain layer.
  if (!state.password.trim()) {
    errors.password = "A senha é obrigatória.";
  } else if (state.password.length < 8) {
    errors.password = "A senha precisa ter no mínimo 8 caracteres.";
  } else if (!(/[a-z]/.test(state.password) && /[A-Z]/.test(state.password))) {
    errors.password = "A senha precisa conter letras maiúsculas e minúsculas.";
  } else if (!/[0-9]/.test(state.password)) {
    errors.password = "A senha precisa conter pelo menos um número.";
  }

  if (!state.terms_accepted) {
    errors.terms_accepted = "É necessário aceitar os termos de uso.";
  }

  return errors;
}

export interface RegistrationFormProps {
  kind: "venue" | "promoter";
  onSubmit: (payload: RegisterVenuePayload | RegisterPromoterPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function RegistrationForm({
  kind,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: RegistrationFormProps) {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setState((previous) => ({ ...previous, [field]: value }));
  }

  function handleTextChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateField(field, event.target.value as FormState[typeof field]);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validate(kind, state);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    if (kind === "venue") {
      const payload: RegisterVenuePayload = {
        name: state.name,
        description: state.description,
        address: state.address,
        city: state.city as City,
        contact_phone: state.contact_phone,
        contact_email: state.contact_email,
        registration_email: state.registration_email,
        password: state.password,
        terms_accepted: state.terms_accepted,
      };
      await onSubmit(payload);
      return;
    }

    const payload: RegisterPromoterPayload = {
      name: state.name,
      contact_phone: state.contact_phone,
      contact_email: state.contact_email,
      instagram: state.instagram || null,
      tiktok: state.tiktok || null,
      registration_email: state.registration_email,
      password: state.password,
      terms_accepted: state.terms_accepted,
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

      <Field id="name" label="Nome" error={errors.name}>
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

      {kind === "venue" ? (
        <>
          <Field id="description" label="Descrição" error={errors.description}>
            <textarea
              id="description"
              className={INPUT_CLASS}
              rows={4}
              value={state.description}
              onChange={handleTextChange("description")}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
          </Field>

          <Field id="address" label="Endereço" error={errors.address}>
            <input
              id="address"
              type="text"
              className={INPUT_CLASS}
              value={state.address}
              onChange={handleTextChange("address")}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
          </Field>

          <Field id="city" label="Cidade" error={errors.city}>
            <select
              id="city"
              className={SELECT_CLASS}
              value={state.city}
              onChange={handleTextChange("city")}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
            >
              <option value="">Selecione</option>
              {Object.values(City).map((cityValue) => (
                <option key={cityValue} value={cityValue}>
                  {CityLabel[cityValue]}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : null}

      <Field id="contact_phone" label="Telefone de contato" error={errors.contact_phone}>
        <input
          id="contact_phone"
          type="tel"
          className={INPUT_CLASS}
          value={state.contact_phone}
          onChange={handleTextChange("contact_phone")}
          aria-invalid={Boolean(errors.contact_phone)}
          aria-describedby={errors.contact_phone ? "contact_phone-error" : undefined}
        />
      </Field>

      <Field id="contact_email" label="E-mail de contato" error={errors.contact_email}>
        <input
          id="contact_email"
          type="email"
          className={INPUT_CLASS}
          value={state.contact_email}
          onChange={handleTextChange("contact_email")}
          aria-invalid={Boolean(errors.contact_email)}
          aria-describedby={errors.contact_email ? "contact_email-error" : undefined}
        />
      </Field>

      {kind === "promoter" ? (
        <>
          <Field id="instagram" label="Instagram (opcional)">
            <input
              id="instagram"
              type="text"
              className={INPUT_CLASS}
              value={state.instagram}
              onChange={handleTextChange("instagram")}
            />
          </Field>

          <Field id="tiktok" label="TikTok (opcional)">
            <input
              id="tiktok"
              type="text"
              className={INPUT_CLASS}
              value={state.tiktok}
              onChange={handleTextChange("tiktok")}
            />
          </Field>
        </>
      ) : null}

      <Field
        id="registration_email"
        label="E-mail de cadastro"
        error={errors.registration_email}
      >
        <input
          id="registration_email"
          type="email"
          className={INPUT_CLASS}
          value={state.registration_email}
          onChange={handleTextChange("registration_email")}
          aria-invalid={Boolean(errors.registration_email)}
          aria-describedby={errors.registration_email ? "registration_email-error" : undefined}
        />
      </Field>

      <Field id="password" label="Senha" error={errors.password}>
        <input
          id="password"
          type="password"
          className={INPUT_CLASS}
          value={state.password}
          onChange={handleTextChange("password")}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            id="terms_accepted"
            type="checkbox"
            className={CHECKBOX_CLASS}
            checked={state.terms_accepted}
            onChange={(event) => updateField("terms_accepted", event.target.checked)}
            aria-invalid={Boolean(errors.terms_accepted)}
            aria-describedby={errors.terms_accepted ? "terms_accepted-error" : undefined}
          />
          <label htmlFor="terms_accepted" className="text-sm text-admin-text-secondary">
            Aceito os termos de uso
          </label>
        </div>
        {errors.terms_accepted ? (
          <p id="terms_accepted-error" role="alert" className="text-sm text-admin-danger">
            {errors.terms_accepted}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-admin-button bg-admin-primary px-5 py-2.5 text-sm font-medium text-white transition-[background-color] duration-admin-control ease-admin-control disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Cadastrar"}
      </button>
    </form>
  );
}
