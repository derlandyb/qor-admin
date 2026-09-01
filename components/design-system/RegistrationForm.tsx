"use client";

import { useState, type FormEvent } from "react";
import { TextField, TextAreaField, SelectField } from "./Field";
import { Button } from "./Button";
import { CITY_VALUES, CITY_LABELS } from "../../lib/enums/city";
import {
  validateVenueRegistration,
  validatePromoterRegistration,
  type VenueRegistrationDraft,
  type PromoterRegistrationDraft,
} from "./form-validation";

const CITY_OPTIONS = CITY_VALUES.map((value) => ({ value, label: CITY_LABELS[value] }));

export interface VenueRegistrationFormProps {
  type: "venue";
  onSubmit: (values: VenueRegistrationDraft) => void;
}

export interface PromoterRegistrationFormProps {
  type: "promoter";
  onSubmit: (values: PromoterRegistrationDraft) => void;
}

export type RegistrationFormProps = VenueRegistrationFormProps | PromoterRegistrationFormProps;

const VENUE_DRAFT: VenueRegistrationDraft = {
  name: "",
  description: "",
  address: "",
  city: "vitoria",
  contact_phone: "",
  contact_email: "",
  registration_email: "",
  password: "",
  terms_accepted: false,
};

const PROMOTER_DRAFT: PromoterRegistrationDraft = {
  name: "",
  contact_phone: "",
  contact_email: "",
  instagram: "",
  tiktok: "",
  registration_email: "",
  password: "",
  terms_accepted: false,
};

/**
 * design-system-admin.md §5.8 — dark-fill inputs, per-input-type radius, no
 * focus transition. Field sets sourced from api's RegisterVenueRequest /
 * RegisterPromoterRequest. terms_accepted is captured here as a plain
 * checkbox — the shared ConsentCapture component (this repo's own copy)
 * is a separate, page-level concern (its own richer pt-BR terms/privacy
 * display) wired into the registration pages in a follow-up session.
 */
export function RegistrationForm(props: RegistrationFormProps) {
  if (props.type === "venue") {
    return <VenueFields onSubmit={props.onSubmit} />;
  }
  return <PromoterFields onSubmit={props.onSubmit} />;
}

function VenueFields({ onSubmit }: { onSubmit: (values: VenueRegistrationDraft) => void }) {
  const [values, setValues] = useState<VenueRegistrationDraft>(VENUE_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateVenueRegistration(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        id="venue-name"
        label="Nome"
        value={values.name}
        error={errors.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      <TextAreaField
        id="venue-description"
        label="Descrição"
        value={values.description}
        error={errors.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
      />
      <TextField
        id="venue-address"
        label="Endereço"
        value={values.address}
        error={errors.address}
        onChange={(e) => setValues({ ...values, address: e.target.value })}
      />
      <SelectField
        id="venue-city"
        label="Cidade"
        options={CITY_OPTIONS}
        value={values.city}
        error={errors.city}
        onChange={(e) => setValues({ ...values, city: e.target.value as typeof values.city })}
      />
      <TextField
        id="venue-contact-phone"
        label="Telefone de contato"
        value={values.contact_phone}
        error={errors.contact_phone}
        onChange={(e) => setValues({ ...values, contact_phone: e.target.value })}
      />
      <TextField
        id="venue-contact-email"
        label="E-mail de contato"
        type="email"
        value={values.contact_email}
        error={errors.contact_email}
        onChange={(e) => setValues({ ...values, contact_email: e.target.value })}
      />
      <TextField
        id="venue-registration-email"
        label="E-mail de cadastro"
        type="email"
        value={values.registration_email}
        error={errors.registration_email}
        onChange={(e) => setValues({ ...values, registration_email: e.target.value })}
      />
      <TextField
        id="venue-password"
        label="Senha"
        type="password"
        value={values.password}
        error={errors.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
      />
      <TermsCheckbox
        checked={values.terms_accepted}
        error={errors.terms_accepted}
        onChange={(checked) => setValues({ ...values, terms_accepted: checked })}
      />
      <Button type="submit">Cadastrar</Button>
    </form>
  );
}

function PromoterFields({ onSubmit }: { onSubmit: (values: PromoterRegistrationDraft) => void }) {
  const [values, setValues] = useState<PromoterRegistrationDraft>(PROMOTER_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePromoterRegistration(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        id="promoter-name"
        label="Nome"
        value={values.name}
        error={errors.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      <TextField
        id="promoter-contact-phone"
        label="Telefone de contato"
        value={values.contact_phone}
        error={errors.contact_phone}
        onChange={(e) => setValues({ ...values, contact_phone: e.target.value })}
      />
      <TextField
        id="promoter-contact-email"
        label="E-mail de contato"
        type="email"
        value={values.contact_email}
        error={errors.contact_email}
        onChange={(e) => setValues({ ...values, contact_email: e.target.value })}
      />
      <TextField
        id="promoter-instagram"
        label="Instagram"
        value={values.instagram ?? ""}
        onChange={(e) => setValues({ ...values, instagram: e.target.value })}
      />
      <TextField
        id="promoter-tiktok"
        label="TikTok"
        value={values.tiktok ?? ""}
        onChange={(e) => setValues({ ...values, tiktok: e.target.value })}
      />
      <TextField
        id="promoter-registration-email"
        label="E-mail de cadastro"
        type="email"
        value={values.registration_email}
        error={errors.registration_email}
        onChange={(e) => setValues({ ...values, registration_email: e.target.value })}
      />
      <TextField
        id="promoter-password"
        label="Senha"
        type="password"
        value={values.password}
        error={errors.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
      />
      <TermsCheckbox
        checked={values.terms_accepted}
        error={errors.terms_accepted}
        onChange={(checked) => setValues({ ...values, terms_accepted: checked })}
      />
      <Button type="submit">Cadastrar</Button>
    </form>
  );
}

function TermsCheckbox({
  checked,
  error,
  onChange,
}: {
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm text-admin-text-secondary">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded-admin-input-select border border-white/10 bg-admin-bg-surface"
        />
        Aceito os termos de uso
      </label>
      {error && (
        <p role="alert" className="text-xs text-admin-danger">
          {error}
        </p>
      )}
    </div>
  );
}
