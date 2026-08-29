import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminApiBaseUrl, PROFILE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/api/session-cookie";
import { SUPER_ADMIN_PERMISSION, type AdminAccount } from "@/lib/api/types";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();

  const upstream = await fetch(`${adminApiBaseUrl()}/api/admin/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  });

  const payload = (await upstream.json()) as { data?: AdminAccount; token?: string; message?: string };

  if (!upstream.ok || !payload.token || !payload.data) {
    return NextResponse.json({ message: payload.message ?? "Falha ao autenticar." }, {
      status: upstream.status,
    });
  }

  const store = await cookies();
  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  store.set(SESSION_COOKIE_NAME, payload.token, { ...cookieOptions, httpOnly: true });
  store.set(
    PROFILE_COOKIE_NAME,
    JSON.stringify({
      name: payload.data.name,
      isSuperAdmin: payload.data.permissions.includes(SUPER_ADMIN_PERMISSION),
    }),
    { ...cookieOptions, httpOnly: false },
  );

  return NextResponse.json({ data: payload.data });
}

export async function DELETE(): Promise<NextResponse> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await fetch(`${adminApiBaseUrl()}/api/admin/v1/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => undefined);
  }

  store.delete(SESSION_COOKIE_NAME);
  store.delete(PROFILE_COOKIE_NAME);

  return NextResponse.json({ message: "Sessão encerrada." });
}
