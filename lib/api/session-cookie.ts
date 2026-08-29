/**
 * ARCHITECTURE §2 requires httpOnly SPA-cookie auth for the admin panel and
 * forbids a token ever reaching browser JS storage. qor-api's admin login
 * (AdminAuthController::login) issues a Sanctum bearer token in the JSON
 * body rather than a native Sanctum SPA session cookie — so this Next.js
 * app is the compliance boundary: it never lets that token reach the
 * browser. `/api/session` and `/api/admin/[...path]` (server-only route
 * handlers) hold the token in an httpOnly cookie and attach it as an
 * `Authorization` header when proxying to qor-api. The browser only ever
 * talks to this same-origin API, never to qor-api directly.
 */
export const SESSION_COOKIE_NAME = "qor_admin_session";

export function adminApiBaseUrl(): string {
  return process.env.ADMIN_API_BASE_URL ?? "http://localhost:8000";
}
