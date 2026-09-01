import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  login,
  logout,
  registerVenue,
  registerPromoter,
  updateVenueProfile,
  updatePromoterProfile,
  getDashboard,
  getSubscription,
  listEvents,
  decideAccountApproval,
  decideEventApproval,
  listPendingAccounts,
  listPendingEvents,
  createEvent,
  editEvent,
  submitEventForReview,
  duplicateEvent,
  cancelEvent,
  deleteEvent,
  listPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
} from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin API client request builders", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ data: {} })));
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN login credentials WHEN login() is called THEN it POSTs to /auth/login as JSON", async () => {
    await login({ email: "admin@qor.app", password: "secret" });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/auth/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "admin@qor.app", password: "secret" });
  });

  test("GIVEN a venue registration payload WHEN registerVenue() is called THEN it POSTs to /venues/register with terms_accepted", async () => {
    await registerVenue({
      name: "Casa de Shows",
      description: "Live music venue",
      address: "Rua X, 100",
      city: "vitoria",
      contact_phone: "27999999999",
      contact_email: "contato@casa.com",
      registration_email: "admin@casa.com",
      password: "secret123",
      terms_accepted: true,
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/venues/register");
    expect(JSON.parse(init.body).terms_accepted).toBe(true);
  });

  test("GIVEN a promoter registration payload WHEN registerPromoter() is called THEN it POSTs to /promoters/register", async () => {
    await registerPromoter({
      name: "DJ Promo",
      contact_phone: "27988888888",
      contact_email: "dj@promo.com",
      registration_email: "dj@promo.com",
      password: "secret123",
      terms_accepted: true,
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/promoters/register");
  });

  test("GIVEN a pending accounts page WHEN listPendingAccounts() is called THEN it GETs /approvals/accounts with the page query param", async () => {
    await listPendingAccounts(2);

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/approvals/accounts?page=2");
  });

  test("GIVEN an account decision WHEN decideAccountApproval() is called THEN it POSTs to the correctly interpolated decide route", async () => {
    await decideAccountApproval("venue", 42, { outcome: "approved" });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/approvals/accounts/venue/42/decide");
    expect(JSON.parse(init.body)).toEqual({ outcome: "approved" });
  });

  test("GIVEN an event decision WHEN decideEventApproval() is called THEN it POSTs to /approvals/events/:id/decide", async () => {
    await decideEventApproval(7, { outcome: "rejected", feedback: "Faltam detalhes." });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/approvals/events/7/decide");
    expect(JSON.parse(init.body)).toEqual({ outcome: "rejected", feedback: "Faltam detalhes." });
  });

  test("GIVEN event fields with no file WHEN createEvent() is called THEN it sends a multipart form with is_free coerced to 1/0", async () => {
    await createEvent({
      title: "Show",
      description: "desc",
      starts_at: "2026-10-01T20:00:00-03:00",
      city: "vitoria",
      genre_id: 1,
      is_free: false,
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [, init] = fetchMock.mock.calls.at(-1)!;
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("is_free")).toBe("0");
  });

  test("GIVEN edit fields WHEN editEvent() is called THEN it POSTs (not PATCHes) with _method=PATCH spoofing", async () => {
    await editEvent(9, { title: "Novo título" });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/events/9");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("_method")).toBe("PATCH");
  });

  test("GIVEN an event id WHEN submitEventForReview() is called THEN it POSTs to /events/:id/submit with no body", async () => {
    await submitEventForReview(3);

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/events/3/submit");
    expect(init.method).toBe("POST");
  });

  test("GIVEN a logged-in session WHEN logout() is called THEN it POSTs to /auth/logout", async () => {
    await logout();

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/auth/logout");
    expect(init.method).toBe("POST");
  });

  test("GIVEN profile fields with no file WHEN updateVenueProfile() is called THEN it POSTs (spoofed PATCH) to /venues/me", async () => {
    await updateVenueProfile({ name: "Novo Nome" });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/venues/me");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("_method")).toBe("PATCH");
  });

  test("GIVEN profile fields WHEN updatePromoterProfile() is called THEN it PATCHes /promoters/me as JSON", async () => {
    await updatePromoterProfile({ instagram: "@djpromo" });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/promoters/me");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ instagram: "@djpromo" });
  });

  test("GIVEN an organizer session WHEN getDashboard() is called THEN it GETs /dashboard", async () => {
    await getDashboard();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("/dashboard");
  });

  test("GIVEN an organizer session WHEN getSubscription() is called THEN it GETs /subscription", async () => {
    await getSubscription();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("/subscription");
  });

  test("GIVEN an organizer session WHEN listEvents() is called THEN it GETs /events", async () => {
    await listEvents();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/events");
    expect(init.method ?? "GET").toBe("GET");
  });

  test("GIVEN an event id and a new date WHEN duplicateEvent() is called THEN it POSTs to /events/:id/duplicate with starts_at", async () => {
    await duplicateEvent(5, "2026-11-01T20:00:00-03:00");

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/events/5/duplicate");
    expect(JSON.parse(init.body)).toEqual({ starts_at: "2026-11-01T20:00:00-03:00" });
  });

  test("GIVEN an event id WHEN cancelEvent() is called THEN it POSTs to /events/:id/cancel", async () => {
    await cancelEvent(5);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("/events/5/cancel");
  });

  test("GIVEN an event id WHEN deleteEvent() is called THEN it DELETEs /events/:id", async () => {
    await deleteEvent(5);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/events/5");
    expect(init.method).toBe("DELETE");
  });

  test("GIVEN a pending events page WHEN listPendingEvents() is called THEN it GETs /approvals/events with the page query param", async () => {
    await listPendingEvents(3);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("/approvals/events?page=3");
  });

  test("GIVEN a Super Admin session WHEN listPlans() is called THEN it GETs /plans", async () => {
    await listPlans();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("/plans");
  });

  test("GIVEN a plan payload WHEN createPlan() is called THEN it POSTs to /plans as JSON", async () => {
    await createPlan({ name: "Pro", monthly_price: 49.9, publish_quota: 20 });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/plans");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ name: "Pro", monthly_price: 49.9, publish_quota: 20 });
  });

  test("GIVEN a plan id and payload WHEN updatePlan() is called THEN it PATCHes /plans/:id", async () => {
    await updatePlan(1, { name: "Pro", monthly_price: 59.9, publish_quota: null });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/plans/1");
    expect(init.method).toBe("PATCH");
  });

  test("GIVEN a plan id WHEN deactivatePlan() is called THEN it POSTs to /plans/:id/deactivate", async () => {
    await deactivatePlan(1);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("/plans/1/deactivate");
  });
});
