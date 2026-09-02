import type {
  RegisterVenuePayload,
  RegisterPromoterPayload,
  CreateEventFields,
  PlanPayload,
} from "../../lib/api/client";

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

/**
 * qor-api's CreatePlanRequest/UpdatePlanRequest currently validate
 * publish_quota as a required, non-nullable integer (min:0) — the
 * "unlimited" (null) case the Plan/Subscription domain model documents
 * isn't actually reachable through this endpoint yet (see STATE.md Todos).
 * This form therefore requires it too, rather than offering an
 * "unlimited" toggle the backend would reject.
 */
export function validatePlanFields(values: Partial<PlanPayload>): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name?.trim()) errors.name = REQUIRED;

  if (values.monthly_price === undefined || values.monthly_price === null) {
    errors.monthly_price = "O preço mensal é obrigatório";
  } else if (values.monthly_price < 0) {
    errors.monthly_price = "O preço mensal deve ser maior ou igual a zero.";
  }

  if (values.annual_price !== undefined && values.annual_price !== null && values.annual_price < 0) {
    errors.annual_price = "O preço anual deve ser maior ou igual a zero.";
  }

  if (values.publish_quota === undefined || values.publish_quota === null) {
    errors.publish_quota = REQUIRED;
  } else if (values.publish_quota < 0) {
    errors.publish_quota = "A cota de publicações deve ser maior ou igual a zero.";
  }

  return errors;
}
