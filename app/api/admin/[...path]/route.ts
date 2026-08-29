import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminApiBaseUrl, SESSION_COOKIE_NAME } from "@/lib/api/session-cookie";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  const url = new URL(request.url);
  const upstreamUrl = `${adminApiBaseUrl()}/api/admin/v1/${path.join("/")}${url.search}`;

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
