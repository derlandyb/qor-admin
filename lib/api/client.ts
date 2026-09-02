/**
 * Typed request builders for every `/api/admin/v1` route in
 * api/routes/api_admin_v1.php. One function per endpoint — call sites (hooks,
 * in a later session) never build fetch requests directly.
 */
import { apiRequest } from "./http";
import type {
  AdminAccount,
  AdminSessionAccount,
  ApprovalDecision,
  DashboardEvent,
  DataEnvelope,
  Event,
  Paginated,
  PendingAccount,
  Plan,
  Promoter,
  UsageSummary,
  Venue,
} from "./types";
import type { City } from "../enums/city";
import type { ApprovalDecidableType, ApprovalOutcome } from "../enums/approval";

// --- Auth ---

export interface LoginPayload {
  email: string;
  password: string;
}

/** Cookie-based session is established as a side effect; the response's `token` field is intentionally ignored (see lib/api/http.ts). */
export function login(payload: LoginPayload) {
  return apiRequest<DataEnvelope<AdminAccount> & { token: string }>("/auth/login", {
    method: "POST",
    json: payload,
  });
}

export function logout() {
  return apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
}

/** Re-fetched on every page load — the SPA never persists session/role state client-side (ARCHITECTURE §2). */
export function getMe() {
  return apiRequest<DataEnvelope<AdminSessionAccount>>("/me");
}

// --- Venue registration/profile ---

export interface RegisterVenuePayload {
  name: string;
  description: string;
  address: string;
  city: City;
  contact_phone: string;
  contact_email: string;
  registration_email: string;
  password: string;
  terms_accepted: true;
}

export function registerVenue(payload: RegisterVenuePayload) {
  return apiRequest<DataEnvelope<Venue>>("/venues/register", {
    method: "POST",
    json: payload,
  });
}

export interface UpdateVenueProfileFields {
  name?: string;
  description?: string;
  address?: string;
  city?: City;
  contact_phone?: string;
  contact_email?: string;
  image?: File;
}

/** Sent as POST + `_method=PATCH` spoofing — PHP does not populate `$_FILES` on a literal multipart PATCH/PUT request. */
export function updateVenueProfile(fields: UpdateVenueProfileFields) {
  return apiRequest<DataEnvelope<Venue>>("/venues/me", {
    method: "POST",
    form: toSpoofedPatchForm(fields),
  });
}

export function getVenueProfile() {
  return apiRequest<DataEnvelope<Venue>>("/venues/me");
}

// --- Promoter registration/profile ---

export interface RegisterPromoterPayload {
  name: string;
  contact_phone: string;
  contact_email: string;
  instagram?: string | null;
  tiktok?: string | null;
  registration_email: string;
  password: string;
  terms_accepted: true;
}

export function registerPromoter(payload: RegisterPromoterPayload) {
  return apiRequest<DataEnvelope<Promoter>>("/promoters/register", {
    method: "POST",
    json: payload,
  });
}

export interface UpdatePromoterProfileFields {
  name?: string;
  contact_phone?: string;
  contact_email?: string;
  instagram?: string | null;
  tiktok?: string | null;
}

export function updatePromoterProfile(fields: UpdatePromoterProfileFields) {
  return apiRequest<DataEnvelope<Promoter>>("/promoters/me", {
    method: "PATCH",
    json: fields,
  });
}

export function getPromoterProfile() {
  return apiRequest<DataEnvelope<Promoter>>("/promoters/me");
}

// --- Dashboard / subscription (organizer) ---

export function getDashboard() {
  return apiRequest<DataEnvelope<DashboardEvent[]>>("/dashboard");
}

export function getSubscription() {
  return apiRequest<DataEnvelope<UsageSummary>>("/subscription");
}

// --- Events (organizer CRUD) ---

export function listEvents() {
  return apiRequest<DataEnvelope<Event[]>>("/events");
}

export interface CreateEventFields {
  title: string;
  description: string;
  starts_at: string;
  city: City;
  genre_id: number;
  is_free: boolean;
  address?: string | null;
  cover_image?: File;
  ticket_url?: string | null;
  capacity?: number | null;
  age_rating?: string | null;
  notes?: string | null;
  promoter_ids?: number[];
}

export function createEvent(fields: CreateEventFields) {
  return apiRequest<DataEnvelope<Event>>("/events", {
    method: "POST",
    form: toForm(fields),
  });
}

export function submitEventForReview(id: number) {
  return apiRequest<DataEnvelope<Event>>(`/events/${id}/submit`, { method: "POST" });
}

export type EditEventFields = Partial<CreateEventFields>;

/** Sent as POST + `_method=PATCH` spoofing — PHP does not populate `$_FILES` on a literal multipart PATCH/PUT request. */
export function editEvent(id: number, fields: EditEventFields) {
  return apiRequest<DataEnvelope<Event>>(`/events/${id}`, {
    method: "POST",
    form: toSpoofedPatchForm(fields),
  });
}

export function duplicateEvent(id: number, startsAt: string) {
  return apiRequest<DataEnvelope<Event>>(`/events/${id}/duplicate`, {
    method: "POST",
    json: { starts_at: startsAt },
  });
}

export function cancelEvent(id: number) {
  return apiRequest<DataEnvelope<Event>>(`/events/${id}/cancel`, { method: "POST" });
}

export function deleteEvent(id: number) {
  return apiRequest<{ message: string }>(`/events/${id}`, { method: "DELETE" });
}

// --- Approvals (Super Admin) ---

export function listPendingAccounts(page = 1) {
  return apiRequest<Paginated<PendingAccount>>("/approvals/accounts", { query: { page } });
}

export interface DecideApprovalPayload {
  outcome: ApprovalOutcome;
  reason?: string | null;
}

export function decideAccountApproval(
  accountType: ApprovalDecidableType,
  id: number,
  payload: DecideApprovalPayload,
) {
  return apiRequest<DataEnvelope<ApprovalDecision>>(
    `/approvals/accounts/${accountType}/${id}/decide`,
    { method: "POST", json: payload },
  );
}

export function listPendingEvents(page = 1) {
  return apiRequest<Paginated<Event>>("/approvals/events", { query: { page } });
}

export interface DecideEventApprovalPayload {
  outcome: ApprovalOutcome;
  feedback?: string | null;
}

export function decideEventApproval(id: number, payload: DecideEventApprovalPayload) {
  return apiRequest<DataEnvelope<ApprovalDecision>>(`/approvals/events/${id}/decide`, {
    method: "POST",
    json: payload,
  });
}

// --- Plans (Super Admin) ---

export function listPlans() {
  return apiRequest<DataEnvelope<Plan[]>>("/plans");
}

export interface PlanPayload {
  name: string;
  monthly_price: number;
  annual_price?: number | null;
  publish_quota: number | null;
}

export function createPlan(payload: PlanPayload) {
  return apiRequest<DataEnvelope<Plan>>("/plans", { method: "POST", json: payload });
}

export function updatePlan(id: number, payload: PlanPayload) {
  return apiRequest<DataEnvelope<Plan>>(`/plans/${id}`, { method: "PATCH", json: payload });
}

export function deactivatePlan(id: number) {
  return apiRequest<DataEnvelope<Plan>>(`/plans/${id}/deactivate`, { method: "POST" });
}

// --- helpers ---

function toForm<T extends object>(fields: T): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      form.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => form.append(`${key}[${index}]`, String(item)));
    } else if (typeof value === "boolean") {
      form.append(key, value ? "1" : "0");
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}

/** Laravel requires `_method` spoofing to parse multipart bodies on non-POST routes. */
function toSpoofedPatchForm<T extends object>(fields: T): FormData {
  const form = toForm(fields);
  form.append("_method", "PATCH");
  return form;
}
