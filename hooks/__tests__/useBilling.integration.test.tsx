/**
 * Integration test for AT25's hooks: unlike useBilling.test.ts (which mocks
 * lib/api/client.ts directly), this exercises the real hook -> client ->
 * http.ts stack against a mocked global fetch, the same technique
 * useApprovalQueues.integration.test.tsx uses.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePlans, useOrganizerSubscription } from "../useBilling";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const plan = {
  id: 1,
  name: "Gratuito",
  monthly_price: 0,
  annual_price: null,
  publish_quota: 5,
  is_active: true,
  is_default_free: true,
};

describe("billing hooks (integration, real client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN the plans page WHEN usePlans() mounts THEN it fetches /plans and exposes the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [plan] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.plans).toEqual([plan]);
    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/plans");
  });

  test("GIVEN a loaded plan list WHEN create() is called THEN it POSTs the payload then refetches the list", async () => {
    const listPage = jsonResponse({ data: [] });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(listPage) // initial mount fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // /sanctum/csrf-cookie bootstrap
      .mockResolvedValueOnce(jsonResponse({ data: plan })) // create POST
      .mockResolvedValueOnce(jsonResponse({ data: [plan] })); // refetch after create
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.create({
        name: "Gratuito",
        monthly_price: 0,
        annual_price: null,
        publish_quota: 5,
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [createUrl, createInit] = fetchMock.mock.calls[2]!;
    expect(String(createUrl)).toContain("/api/admin/v1/plans");
    expect(createInit.method).toBe("POST");
    expect(result.current.plans).toEqual([plan]);
  });

  test("GIVEN the organizer's subscription page WHEN useOrganizerSubscription() mounts THEN it fetches /subscription", async () => {
    const usage = {
      plan_name: "Gratuito",
      monthly_price: 0,
      publish_quota: 5,
      publishes_used_this_period: 2,
      is_at_limit: false,
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: usage }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useOrganizerSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usage).toEqual(usage);
    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/subscription");
  });
});
