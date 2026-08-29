import { act, renderHook, waitFor } from "@testing-library/react";

import type { Plan, UsageSummary } from "@/lib/api/types";
import { usePlans, useOrganizerSubscription } from "../useBilling";

/**
 * Integration tests: unlike useBilling.test.ts (which mocks apiClient
 * directly), these mock the network boundary (global.fetch) so the real,
 * un-mocked apiClient runs end-to-end together with the hooks.
 */

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  (global as unknown as { fetch: jest.Mock }).fetch = mockFetch;
});

const plan1: Plan = {
  id: 1,
  name: "Básico",
  monthly_price: 99,
  annual_price: null,
  publish_quota: 5,
  is_active: true,
  is_default_free: false,
};

const plan2: Plan = {
  id: 2,
  name: "Pro",
  monthly_price: 199,
  annual_price: 1990,
  publish_quota: 20,
  is_active: true,
  is_default_free: false,
};

describe("usePlans (integration, real apiClient + fetch)", () => {
  test("GIVEN a plan list response WHEN the hook mounts THEN plans is populated via the real apiClient", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: [plan1] }));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plans).toEqual([plan1]);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/plans",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
  });

  test("GIVEN create is called WHEN it resolves THEN fetch hits the create endpoint and plans is updated", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { data: [plan1] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: plan2 }));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload = { name: "Pro", monthly_price: 199, annual_price: 1990, publish_quota: 20 };

    await act(async () => {
      await result.current.create(payload);
    });

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/plans",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      }),
    );
    expect(result.current.plans).toEqual([plan1, plan2]);
  });

  test("GIVEN deactivate is called WHEN it resolves THEN fetch hits the deactivate endpoint and plans is updated", async () => {
    const deactivated: Plan = { ...plan1, is_active: false };
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { data: [plan1] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: deactivated }));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deactivate(1);
    });

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/plans/1/deactivate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.plans).toEqual([deactivated]);
  });

  test("GIVEN a non-2xx response with a pt-BR message WHEN the hook mounts THEN error is set from the thrown ApiError", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { message: "Não autorizado." }));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Não autorizado.");
    expect(result.current.plans).toEqual([]);
  });
});

describe("useOrganizerSubscription (integration, real apiClient + fetch)", () => {
  const usage: UsageSummary = {
    plan_name: "Pro",
    monthly_price: 199,
    publish_quota: 20,
    publishes_used_this_period: 5,
    is_at_limit: false,
  };

  test("GIVEN a usage summary response WHEN the hook mounts THEN usage is populated via the real apiClient", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: usage }));

    const { result } = renderHook(() => useOrganizerSubscription());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.usage).toEqual(usage);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/subscription",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
  });

  test("GIVEN a non-2xx response with a pt-BR message WHEN the hook mounts THEN error is set from the thrown ApiError", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { message: "Assinatura não encontrada." }));

    const { result } = renderHook(() => useOrganizerSubscription());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Assinatura não encontrada.");
    expect(result.current.usage).toBeNull();
  });
});
