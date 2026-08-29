/**
 * @jest-environment node
 *
 * Route handlers use next/server's NextResponse (which extends the
 * platform Request/Response), unavailable under the default jsdom
 * environment — Next's own docs recommend node for route-handler tests.
 */
import { PROFILE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/api/session-cookie";

const cookieStore = new Map<string, { value: string }>();
const setMock = jest.fn((name: string, value: string) => cookieStore.set(name, { value }));
const deleteMock = jest.fn((name: string) => cookieStore.delete(name));
const getMock = jest.fn((name: string) => cookieStore.get(name));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: getMock, set: setMock, delete: deleteMock }),
}));

import { DELETE, POST } from "../route";

function mockFetchOnce(body: unknown, init?: { status?: number }) {
  const status = init?.status ?? 200;
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("POST /api/session", () => {
  beforeEach(() => {
    cookieStore.clear();
    jest.clearAllMocks();
  });

  test("GIVEN a successful upstream login WHEN POST is called THEN it sets an httpOnly session cookie and a non-httpOnly profile cookie, never exposing the token", async () => {
    mockFetchOnce({
      data: { id: 1, name: "Ana", email: "ana@qor.app", permissions: ["approvals.manage"] },
      token: "secret-token",
    });

    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify({ email: "ana@qor.app", password: "Senha1234" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { name: string } };
    expect(body.data.name).toBe("Ana");
    expect(JSON.stringify(body)).not.toContain("secret-token");

    expect(setMock).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "secret-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(setMock).toHaveBeenCalledWith(
      PROFILE_COOKIE_NAME,
      expect.stringContaining("Ana"),
      expect.objectContaining({ httpOnly: false }),
    );
  });

  test("GIVEN a failed upstream login WHEN POST is called THEN it returns the upstream error and sets no cookies", async () => {
    mockFetchOnce({ message: "Credenciais inválidas." }, { status: 401 });

    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify({ email: "ana@qor.app", password: "wrong" }),
      }),
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message: string };
    expect(body.message).toBe("Credenciais inválidas.");
    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/session", () => {
  beforeEach(() => {
    cookieStore.clear();
    jest.clearAllMocks();
  });

  test("GIVEN an active session WHEN DELETE is called THEN it calls the upstream logout with the bearer token and clears both cookies", async () => {
    cookieStore.set(SESSION_COOKIE_NAME, { value: "secret-token" });
    mockFetchOnce({ message: "Sessão encerrada." });

    const response = await DELETE();

    expect(response.status).toBe(200);
    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer secret-token");
    expect(deleteMock).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    expect(deleteMock).toHaveBeenCalledWith(PROFILE_COOKIE_NAME);
  });

  test("GIVEN no active session WHEN DELETE is called THEN it still clears cookies without calling upstream", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});
