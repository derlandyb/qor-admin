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

/**
 * Non-httpOnly companion cookie holding only display data (name, whether
 * the account is a Super Admin) — never the token. It exists so client
 * components (Sidebar/Topbar) can render "who's logged in" without a
 * `/me` endpoint (qor-api's admin API doesn't expose one). Purely a UI
 * convenience: losing/spoofing this cookie has no security consequence,
 * since every real request is still gated by the httpOnly session cookie
 * and server-side policies.
 */
export const PROFILE_COOKIE_NAME = "qor_admin_profile";

export interface AdminProfileCookie {
  name: string;
  isSuperAdmin: boolean;
}

export function adminApiBaseUrl(): string {
  return process.env.ADMIN_API_BASE_URL ?? "http://localhost:8000";
}
