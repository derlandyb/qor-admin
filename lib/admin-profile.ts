import { PROFILE_COOKIE_NAME, type AdminProfileCookie } from "@/lib/api/session-cookie";

/** Client-side read of the non-httpOnly qor_admin_profile cookie set by POST /api/session. */
export function readAdminProfile(): AdminProfileCookie | null {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${PROFILE_COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const raw = decodeURIComponent(match.slice(PROFILE_COOKIE_NAME.length + 1));
    const parsed = JSON.parse(raw) as AdminProfileCookie;
    if (typeof parsed.name !== "string" || typeof parsed.isSuperAdmin !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}
