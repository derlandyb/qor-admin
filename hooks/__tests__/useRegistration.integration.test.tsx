/**
 * Integration test for AT12's hooks (useVenueRegistration/usePromoterRegistration,
 * useEvents, useSession): exercises the real hook -> client -> http.ts stack
 * against a mocked global fetch, same technique as
 * hooks/__tests__/useApprovalQueues.integration.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useVenueRegistration, usePromoterRegistration } from "../useRegistration";
import { useEvents } from "../useOrganizerEvents";
import { useSession } from "../useSession";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const validVenuePayload = {
  name: "Casa de Shows",
  description: "Live music venue",
  address: "Rua X, 100",
  city: "vitoria" as const,
  contact_phone: "27999999999",
  contact_email: "venue@qor.app",
  registration_email: "owner@qor.app",
  password: "supersecret",
  terms_accepted: true as const,
};

const validPromoterPayload = {
  name: "DJ Promo",
  contact_phone: "27999999999",
  contact_email: "promo@qor.app",
  registration_email: "promo-owner@qor.app",
  password: "supersecret",
  terms_accepted: true as const,
};

describe("registration/event/session hooks (integration, real client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN valid fields WHEN useVenueRegistration().register() is called THEN it POSTs to /venues/register and returns the created venue", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { id: 1, name: validVenuePayload.name } }, 201),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useVenueRegistration());

    let created: { id: number } | undefined;
    await act(async () => {
      created = (await result.current.register(validVenuePayload)) as unknown as { id: number };
    });

    expect(created?.id).toBe(1);
    expect(result.current.error).toBeNull();
    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/venues/register");
  });

  test("GIVEN the server rejects the promoter payload WHEN register() is called THEN error surfaces and the promise rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: "E-mail já cadastrado.", errors: { registration_email: ["já em uso"] } }, 422),
      ),
    );

    const { result } = renderHook(() => usePromoterRegistration());

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.register(validPromoterPayload);
      } catch (err) {
        caught = err;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect(result.current.error).toBe("E-mail já cadastrado.");
  });

  test("GIVEN an organizer's own events WHEN useEvents() mounts THEN it fetches /events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/events");
  });

  test("GIVEN an authenticated venue admin WHEN useSession() mounts THEN it fetches /me then /venues/me", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: { id: 1, name: "Venue Owner", email: "v@qor.app", permissions: [], account_type: "venue_admin" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: 5, name: "Casa X", address: "Rua Y, 1", city: "vitoria" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account?.account_type).toBe("venue_admin");
    expect(result.current.venue?.address).toBe("Rua Y, 1");
    expect(result.current.promoter).toBeNull();
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]![0])).toContain("/api/admin/v1/me");
    expect(String(fetchMock.mock.calls[1]![0])).toContain("/api/admin/v1/venues/me");
  });

  test("GIVEN an unauthenticated visitor WHEN useSession() mounts THEN it resolves quietly with a null account and no error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Não autenticado." }, 401)));

    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.account).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
