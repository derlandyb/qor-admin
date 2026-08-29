/**
 * @jest-environment node
 *
 * Route handlers use next/server's NextResponse (which extends the
 * platform Request/Response), unavailable under the default jsdom
 * environment — Next's own docs recommend node for route-handler tests.
 */
import { SESSION_COOKIE_NAME } from "@/lib/api/session-cookie";

process.env.ADMIN_API_BASE_URL = "http://api:8000";

const cookieStore = new Map<string, { value: string }>();

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => cookieStore.get(name) }),
}));

import { DELETE, GET, PATCH, POST } from "../route";

function context(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function mockUpstreamOnce(body: unknown, init?: { status?: number; contentType?: string }) {
  const status = init?.status ?? 200;
  global.fetch = jest.fn().mockResolvedValue({
    status,
    text: async () => JSON.stringify(body),
    headers: { get: () => init?.contentType ?? "application/json" },
  }) as unknown as typeof fetch;
}

describe("/api/admin/[...path] proxy", () => {
  beforeEach(() => {
    cookieStore.clear();
    jest.clearAllMocks();
  });

  test("GIVEN a session cookie WHEN a GET is proxied THEN it forwards to /api/admin/v1/<path> with a Bearer Authorization header", async () => {
    cookieStore.set(SESSION_COOKIE_NAME, { value: "secret-token" });
    mockUpstreamOnce({ data: [] });

    const response = await GET(new Request("http://localhost/api/admin/events"), context("events"));

    expect(response.status).toBe(200);
    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://api:8000/api/admin/v1/events");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
  });

  test("GIVEN no session cookie WHEN a request is proxied THEN it forwards without an Authorization header (public endpoints, e.g. registration)", async () => {
    mockUpstreamOnce({ data: { id: 1 } }, { status: 201 });

    await POST(
      new Request("http://localhost/api/admin/venues/register", { method: "POST", body: "{}" }),
      context("venues", "register"),
    );

    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  test.each([[".."], ["events", ".."], ["..", "v1", "events"], ["."], [""]])(
    "GIVEN a path segment of %p WHEN proxied THEN it's rejected with 400 and never reaches fetch",
    async (...segments) => {
      const response = await GET(new Request("http://localhost/api/admin/x"), context(...segments));

      expect(response.status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  test("GIVEN a path segment containing an encoded slash WHEN proxied THEN it's re-encoded, not treated as a literal path separator", async () => {
    mockUpstreamOnce({ data: [] });

    await GET(new Request("http://localhost/api/admin/x"), context("events", "1/../../../secret"));

    const [url] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://api:8000/api/admin/v1/events/1%2F..%2F..%2F..%2Fsecret");
  });

  test("GIVEN a PATCH request WHEN proxied THEN the method and body are forwarded", async () => {
    cookieStore.set(SESSION_COOKIE_NAME, { value: "secret-token" });
    mockUpstreamOnce({ data: { id: 3 } });

    await PATCH(
      new Request("http://localhost/api/admin/plans/3", { method: "PATCH", body: JSON.stringify({ name: "x" }) }),
      context("plans", "3"),
    );

    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
  });

  test("GIVEN a 204 upstream response WHEN proxied THEN it returns an empty 204 without reading a body", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 204 }) as unknown as typeof fetch;

    const response = await DELETE(new Request("http://localhost/api/admin/events/1"), context("events", "1"));

    expect(response.status).toBe(204);
  });

  test("GIVEN a query string WHEN proxied THEN it's preserved on the upstream URL", async () => {
    mockUpstreamOnce({ data: [] });

    await GET(
      new Request("http://localhost/api/admin/approvals/accounts?page=2"),
      context("approvals", "accounts"),
    );

    const [url] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://api:8000/api/admin/v1/approvals/accounts?page=2");
  });
});
