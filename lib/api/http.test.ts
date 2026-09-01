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

  test("GIVEN any other error status WHEN the request fails THEN it throws a plain ApiError, not UnauthenticatedError", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Você não tem permissão para esta ação." }, 403));

    const error = await apiRequest("/plans").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(UnauthenticatedError);
  });
});
