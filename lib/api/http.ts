/**
 * Low-level HTTP transport for `/api/admin/v1`.
 *
 * Cookie-based Sanctum SPA auth per ARCHITECTURE.md §2: every request carries
 * `credentials: "include"`, and every mutating request is preceded by a
 * `/sanctum/csrf-cookie` bootstrap so the `XSRF-TOKEN` cookie exists to mirror
 * into the `X-XSRF-TOKEN` header. This deliberately never reads or stores a
 * bearer token — `AdminAuthController::login()` also returns a `token` field
 * in its JSON body, but that field must never be persisted to
 * localStorage/sessionStorage or attached as an Authorization header; the
 * httpOnly session cookie is the only credential this client uses.
 */

const API_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Raised on a 401 so callers (e.g. a root layout) can redirect to /entrar. */
export class UnauthenticatedError extends ApiError {
  constructor(message: string) {
    super(401, message);
    this.name = "UnauthenticatedError";
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfBootstrapped = false;

async function ensureCsrfCookie(): Promise<void> {
  if (csrfBootstrapped) return;
  await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
  csrfBootstrapped = true;
}

/** Admin login page (design-system-admin.md §5.11 — built in AT15, a later session). */
export const LOGIN_PATH = "/entrar";

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === LOGIN_PATH) return;
  // Fired from plain fetch-response handling, outside React's render/event
  // lifecycle, so `useRouter()`/`redirect()` aren't available here.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = LOGIN_PATH;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  /** JSON body — sent as `application/json`. Mutually exclusive with `form`. */
  json?: unknown;
  /** multipart/form-data body (file uploads) — sent as-is, no Content-Type override. */
  form?: FormData;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}/api/admin/v1${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const isMutating = method !== "GET";

  if (isMutating) {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.json !== undefined) headers["Content-Type"] = "application/json";
  if (isMutating) {
    const xsrfToken = readCookie("XSRF-TOKEN");
    if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    credentials: "include",
    headers,
    body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : null) ?? "Erro inesperado.";
    const errors =
      payload && typeof payload === "object" && "errors" in payload
        ? (payload as { errors: Record<string, string[]> }).errors
        : undefined;

    if (response.status === 401) {
      redirectToLogin();
      throw new UnauthenticatedError(message);
    }
    throw new ApiError(response.status, message, errors);
  }

  return payload as T;
}
