import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { apiRequest, ApiError, UnauthenticatedError, LOGIN_PATH } from "./http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    document.cookie = "";
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "http://localhost:3001/eventos", pathname: "/eventos" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a GET request WHEN it succeeds THEN it returns the parsed JSON body without a CSRF bootstrap call", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [{ id: 1 }] }));

    const result = await apiRequest<{ data: { id: number }[] }>("/events");

    expect(result.data[0].id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("include");
  });

  test("GIVEN a mutating request WHEN it runs THEN it bootstraps the CSRF cookie first and attaches X-XSRF-TOKEN", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementationOnce(async () => {
      document.cookie = "XSRF-TOKEN=abc123";
      return new Response(null, { status: 204 });
    });
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }, 201));

    await apiRequest("/events", { method: "POST", json: { title: "Show" } });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [csrfUrl] = fetchMock.mock.calls[0];
    expect(String(csrfUrl)).toContain("/sanctum/csrf-cookie");
    const [, mutatingInit] = fetchMock.mock.calls[1];
    expect(mutatingInit.headers["X-XSRF-TOKEN"]).toBe("abc123");
  });

  test("GIVEN a validation error response WHEN the request fails THEN it throws ApiError with the field errors", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Dados inválidos.", errors: { name: ["O nome é obrigatório."] } }, 422),
    );

    await expect(apiRequest("/venues/register", { method: "POST", json: {} })).rejects.toMatchObject({
      status: 422,
      errors: { name: ["O nome é obrigatório."] },
    });
  });

  test("GIVEN a 401 response WHEN the request fails THEN it throws UnauthenticatedError and redirects to the admin login route", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Não autenticado." }, 401));

    await expect(apiRequest("/dashboard")).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(window.location.href).toContain(LOGIN_PATH);
  });

  test.each(["/cadastro/local", "/cadastro/promotor"])(
    "GIVEN a 401 response WHEN the request fails on the public route %s THEN it still throws UnauthenticatedError but does NOT redirect",
    async (publicPath) => {
      Object.defineProperty(window, "location", {
        value: { ...window.location, href: `http://localhost:3001${publicPath}`, pathname: publicPath },
        writable: true,
      });
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Não autenticado." }, 401));

      await expect(apiRequest("/me")).rejects.toBeInstanceOf(UnauthenticatedError);

      // A self-registration page must stay put on a 401 from useSession()'s
      // background /me check — an unauthenticated visitor filling out the
      // form is the expected, normal state there, not something to bounce
      // away from (see components/layout/AppShell.tsx's PUBLIC_PATHS).
      expect(window.location.href).toBe(`http://localhost:3001${publicPath}`);
    },
  );

  test("GIVEN any other error status WHEN the request fails THEN it throws a plain ApiError, not UnauthenticatedError", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Você não tem permissão para esta ação." }, 403));

    const error = await apiRequest("/plans").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(UnauthenticatedError);
  });
});

describe("apiRequest — same-origin mode (NEXT_PUBLIC_API_BASE_URL explicitly empty)", () => {
  // AT23: the admin container's own Playwright browser (and, symmetrically,
  // a host browser hitting the host-mapped admin port) must never build an
  // absolute cross-container URL like http://api:8000/... — that's a
  // different site than the page's own origin, so Sanctum's session cookie
  // (set with no explicit Domain, per api/.env's SESSION_DOMAIN=null) would
  // never be attached to it. Docker Compose sets NEXT_PUBLIC_API_BASE_URL=""
  // so the browser instead calls its own origin, relatively, and
  // next.config.ts's rewrites proxy that server-side to the api container.
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 })));
    document.cookie = "";
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "http://localhost:3000/eventos", origin: "http://localhost:3000" },
      writable: true,
    });
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test("GIVEN NEXT_PUBLIC_API_BASE_URL is explicitly empty WHEN a request is built THEN it targets the page's own origin, not the http.ts default host", async () => {
    vi.resetModules();
    const { apiRequest: sameOriginApiRequest } = await import("./http");

    await sameOriginApiRequest("/events");

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("http://localhost:3000/api/admin/v1/events");
  });
});
