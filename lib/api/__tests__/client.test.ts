import { redirectTo } from "@/lib/navigation";
import { apiClient, ApiError } from "../client";

jest.mock("@/lib/navigation", () => ({ redirectTo: jest.fn() }));

function mockFetchOnce(body: unknown, init?: { status?: number }) {
  const status = init?.status ?? 200;
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch;
}

describe("apiClient request builders", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN venue registration fields WHEN venues.register is called THEN it POSTs JSON to the venue-register endpoint", async () => {
    mockFetchOnce({ data: { id: 1 } }, { status: 201 });

    await apiClient.venues.register({
      name: "Casa Show",
      description: "desc",
      address: "Rua X",
      city: "vitoria",
      contact_phone: "27999999999",
      contact_email: "venue@qor.app",
      registration_email: "login@qor.app",
      password: "senha-forte",
      terms_accepted: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/venues/register",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body as string)).toMatchObject({ name: "Casa Show" });
  });

  test("GIVEN a decide-approval call WHEN accountApprovals.decide is called THEN it targets the correct account-type/id path", async () => {
    mockFetchOnce({ data: { id: 5 } });

    await apiClient.accountApprovals.decide("venue", 5, { outcome: "approved" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/approvals/accounts/venue/5/decide",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("GIVEN event creation with a File cover image WHEN events.create is called THEN it sends multipart FormData, not JSON", async () => {
    mockFetchOnce({ data: { id: 9 } }, { status: 201 });

    await apiClient.events.create({
      title: "Show",
      description: "desc",
      starts_at: "2026-09-01T20:00:00Z",
      city: "vitoria",
      genre_id: 1,
      is_free: true,
      cover_image: new File(["x"], "cover.png", { type: "image/png" }),
    });

    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
  });

  test("GIVEN an event update WHEN events.update is called THEN it POSTs FormData with a _method=PATCH override", async () => {
    mockFetchOnce({ data: { id: 9 } });

    await apiClient.events.update(9, { title: "Novo título" });

    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/admin/events/9");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("_method")).toBe("PATCH");
  });

  test("GIVEN a 401 response on a normal request WHEN request() resolves THEN it redirects to /entrar and throws", async () => {
    mockFetchOnce({ message: "Não autenticado." }, { status: 401 });

    await expect(apiClient.dashboard.get()).rejects.toBeInstanceOf(ApiError);
    expect(redirectTo).toHaveBeenCalledWith("/entrar");
  });

  test("GIVEN a 401 response on login WHEN auth.login is called THEN it throws without redirecting", async () => {
    mockFetchOnce({ message: "Credenciais inválidas." }, { status: 401 });

    await expect(apiClient.auth.login("a@b.com", "wrong")).rejects.toThrow("Credenciais inválidas.");
    expect(redirectTo).not.toHaveBeenCalled();
  });
});
