import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminApiBaseUrl, SESSION_COOKIE_NAME } from "@/lib/api/session-cookie";

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * Rejects any segment that isn't a plain path component — in particular
 * "." / ".." (which would let a crafted request escape the
 * /api/admin/v1/ prefix once the upstream URL string is parsed, e.g.
 * .../admin/../../v1/events resolving outside the admin route group
 * this proxy always attaches the admin bearer token to) and empty
 * segments (double slashes). ARCHITECTURE §2 treats the /api/v1 vs
 * /api/admin/v1 split as a hard boundary, not just a naming convention —
 * this keeps the proxy from silently reintroducing it as bypassable.
 */
function isSafePathSegment(segment: string): boolean {
  return segment.length > 0 && segment !== "." && segment !== "..";
}

async function proxy(request: Request, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;

  if (!path.every(isSafePathSegment)) {
    return NextResponse.json({ message: "Caminho inválido." }, { status: 400 });
  }

  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  const url = new URL(request.url);
  const upstreamUrl = `${adminApiBaseUrl()}/api/admin/v1/${path.map(encodeURIComponent).join("/")}${url.search}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // @ts-expect-error -- required by undici when streaming a request body
    duplex: hasBody ? "half" : undefined,
  });

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
