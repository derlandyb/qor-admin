import type { RegisterVenuePayload, RegisterPromoterPayload, CreateEventFields } from "../../lib/api/client";

export type FieldErrors = Record<string, string>;

const REQUIRED = "Este campo é obrigatório.";
const INVALID_EMAIL = "E-mail inválido.";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type VenueRegistrationDraft = Omit<RegisterVenuePayload, "terms_accepted"> & {
  terms_accepted: boolean;
};

export function validateVenueRegistration(values: VenueRegistrationDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = REQUIRED;
  if (!values.description.trim()) errors.description = REQUIRED;
  if (!values.address.trim()) errors.address = REQUIRED;
  if (!values.city) errors.city = REQUIRED;
  if (!values.contact_phone.trim()) errors.contact_phone = REQUIRED;
  if (!values.contact_email.trim()) errors.contact_email = REQUIRED;
  else if (!isEmail(values.contact_email)) errors.contact_email = INVALID_EMAIL;
  if (!values.registration_email.trim()) errors.registration_email = REQUIRED;
  else if (!isEmail(values.registration_email)) errors.registration_email = INVALID_EMAIL;
  if (!values.password.trim()) errors.password = REQUIRED;
  if (!values.terms_accepted) errors.terms_accepted = "É necessário aceitar os termos de uso.";
  return errors;
}

export type PromoterRegistrationDraft = Omit<RegisterPromoterPayload, "terms_accepted"> & {
  terms_accepted: boolean;
};

export function validatePromoterRegistration(values: PromoterRegistrationDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = REQUIRED;
  if (!values.contact_phone.trim()) errors.contact_phone = REQUIRED;
  if (!values.contact_email.trim()) errors.contact_email = REQUIRED;
  else if (!isEmail(values.contact_email)) errors.contact_email = INVALID_EMAIL;
  if (!values.registration_email.trim()) errors.registration_email = REQUIRED;
  else if (!isEmail(values.registration_email)) errors.registration_email = INVALID_EMAIL;
  if (!values.password.trim()) errors.password = REQUIRED;
  if (!values.terms_accepted) errors.terms_accepted = "É necessário aceitar os termos de uso.";
  return errors;
}

export function validateEventFields(values: Partial<CreateEventFields>): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title?.trim()) errors.title = REQUIRED;
  if (!values.description?.trim()) errors.description = REQUIRED;
  if (!values.starts_at?.trim()) errors.starts_at = REQUIRED;
  if (!values.city) errors.city = REQUIRED;
  if (values.genre_id === undefined || values.genre_id === null) errors.genre_id = REQUIRED;
  if (!values.is_free && !values.ticket_url?.trim()) {
    errors.ticket_url = "O link do ingresso é obrigatório para eventos pagos.";
  }
  return errors;
}
