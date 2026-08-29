import { redirectTo } from "@/lib/navigation";
import type {
  AdminAccount,
  ApiErrorBody,
  ApprovalDecision,
  CreateEventPayload,
  DashboardEvent,
  DecideAccountApprovalPayload,
  DecideEventApprovalPayload,
  EditEventPayload,
  Paginated,
  PendingAccount,
  Plan,
  PlanPayload,
  Promoter,
  QorEvent,
  RegisterPromoterPayload,
  RegisterVenuePayload,
  UsageSummary,
  Venue,
} from "@/lib/api/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const UNAUTHENTICATED_REDIRECT = "/entrar";

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: { redirectOnUnauthenticated?: boolean },
): Promise<T> {
  const redirectOnUnauthenticated = options?.redirectOnUnauthenticated ?? true;

  const response = await fetch(path, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (response.status === 401 && redirectOnUnauthenticated) {
    if (typeof window !== "undefined") {
      redirectTo(UNAUTHENTICATED_REDIRECT);
    }
    throw new ApiError("Sessão expirada.", 401);
  }

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    throw new ApiError(
      errorBody?.message ?? "Ocorreu um erro inesperado.",
      response.status,
      errorBody?.errors,
    );
  }

  return body as T;
}

function json(payload: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

function patchJson(payload: unknown): RequestInit {
  return { ...json(payload), method: "PATCH" };
}

function toFormData(payload: object): FormData {
  const entries = payload as Record<string, unknown>;
  const form = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      form.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => form.append(`${key}[]`, String(item)));
    } else {
      form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    }
  });
  return form;
}

export const apiClient = {
  auth: {
    login: (email: string, password: string) =>
      request<{ data: AdminAccount }>("/api/session", json({ email, password }), {
        redirectOnUnauthenticated: false,
      }),
    logout: () => request<{ message: string }>("/api/session", { method: "DELETE" }),
  },

  venues: {
    register: (payload: RegisterVenuePayload) =>
      request<{ data: Venue }>("/api/admin/venues/register", json(payload)),
    updateMe: (payload: Partial<RegisterVenuePayload> & { image?: File | null }) =>
      request<{ data: Venue }>("/api/admin/venues/me", {
        method: "POST",
        body: toFormData({ ...payload, _method: "PATCH" }),
      }),
  },

  promoters: {
    register: (payload: RegisterPromoterPayload) =>
      request<{ data: Promoter }>("/api/admin/promoters/register", json(payload)),
    updateMe: (payload: Partial<RegisterPromoterPayload>) =>
      request<{ data: Promoter }>("/api/admin/promoters/me", patchJson(payload)),
  },

  events: {
    list: () => request<{ data: QorEvent[] }>("/api/admin/events"),
    create: (payload: CreateEventPayload) =>
      request<{ data: QorEvent }>("/api/admin/events", {
        method: "POST",
        body: toFormData(payload),
      }),
    update: (id: number, payload: EditEventPayload) =>
      request<{ data: QorEvent }>(`/api/admin/events/${id}`, {
        method: "POST",
        body: toFormData({ ...payload, _method: "PATCH" }),
      }),
    submit: (id: number) => request<{ data: QorEvent }>(`/api/admin/events/${id}/submit`, { method: "POST" }),
    duplicate: (id: number) =>
      request<{ data: QorEvent }>(`/api/admin/events/${id}/duplicate`, { method: "POST" }),
    cancel: (id: number) => request<{ data: QorEvent }>(`/api/admin/events/${id}/cancel`, { method: "POST" }),
    remove: (id: number) => request<void>(`/api/admin/events/${id}`, { method: "DELETE" }),
  },

  accountApprovals: {
    list: (page = 1) =>
      request<Paginated<PendingAccount>>(`/api/admin/approvals/accounts?page=${page}`),
    decide: (accountType: string, id: number, payload: DecideAccountApprovalPayload) =>
      request<{ data: ApprovalDecision }>(
        `/api/admin/approvals/accounts/${accountType}/${id}/decide`,
        json(payload),
      ),
  },

  eventApprovals: {
    list: (page = 1) => request<Paginated<QorEvent>>(`/api/admin/approvals/events?page=${page}`),
    decide: (id: number, payload: DecideEventApprovalPayload) =>
      request<{ data: ApprovalDecision }>(`/api/admin/approvals/events/${id}/decide`, json(payload)),
  },

  dashboard: {
    get: () => request<{ data: DashboardEvent[] }>("/api/admin/dashboard"),
  },

  subscription: {
    get: () => request<{ data: UsageSummary }>("/api/admin/subscription"),
  },

  plans: {
    list: () => request<{ data: Plan[] }>("/api/admin/plans"),
    create: (payload: PlanPayload) => request<{ data: Plan }>("/api/admin/plans", json(payload)),
    update: (id: number, payload: PlanPayload) =>
      request<{ data: Plan }>(`/api/admin/plans/${id}`, patchJson(payload)),
    deactivate: (id: number) => request<{ data: Plan }>(`/api/admin/plans/${id}/deactivate`, { method: "POST" }),
  },
};
