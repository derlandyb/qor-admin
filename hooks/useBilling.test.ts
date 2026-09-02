import { describe, expect, test, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePlans, useOrganizerSubscription } from "./useBilling";
import * as client from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Plan, UsageSummary } from "../lib/api/types";

vi.mock("../lib/api/client");

const mockedClient = vi.mocked(client);

function makePlan(overrides?: Partial<Plan>): Plan {
  return {
    id: 1,
    name: "Gratuito",
    monthly_price: 0,
    annual_price: null,
    publish_quota: 5,
    is_active: true,
    is_default_free: true,
    ...overrides,
  };
}

function makeUsage(overrides?: Partial<UsageSummary>): UsageSummary {
  return {
    plan_name: "Gratuito",
    monthly_price: 0,
    publish_quota: 5,
    publishes_used_this_period: 2,
    is_at_limit: false,
    ...overrides,
  };
}

describe("usePlans", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN the hook mounts WHEN listPlans resolves THEN it exposes the plans and stops loading", async () => {
    mockedClient.listPlans.mockResolvedValue({ data: [makePlan()] });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plans).toEqual([makePlan()]);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN listPlans rejects WHEN the hook mounts THEN it surfaces the ApiError message and clears plans", async () => {
    mockedClient.listPlans.mockRejectedValue(new ApiError(500, "Erro interno."));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plans).toEqual([]);
    expect(result.current.error).toBe("Erro interno.");
  });

  test("GIVEN a loaded queue WHEN create resolves THEN it refetches the plan list", async () => {
    mockedClient.listPlans.mockResolvedValue({ data: [] });
    mockedClient.createPlan.mockResolvedValue({ data: makePlan() });

    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listPlans.mockResolvedValue({ data: [makePlan()] });
    await act(async () => {
      await result.current.create({ name: "Gratuito", monthly_price: 0, annual_price: null, publish_quota: 5 });
    });

    expect(mockedClient.createPlan).toHaveBeenCalledWith({
      name: "Gratuito",
      monthly_price: 0,
      annual_price: null,
      publish_quota: 5,
    });
    expect(result.current.plans).toEqual([makePlan()]);
  });

  test("GIVEN a loaded queue WHEN update resolves THEN it refetches the plan list", async () => {
    mockedClient.listPlans.mockResolvedValue({ data: [makePlan()] });
    mockedClient.updatePlan.mockResolvedValue({ data: makePlan({ name: "Pro" }) });

    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listPlans.mockResolvedValue({ data: [makePlan({ name: "Pro" })] });
    await act(async () => {
      await result.current.update(1, { name: "Pro", monthly_price: 10, annual_price: null, publish_quota: 20 });
    });

    expect(mockedClient.updatePlan).toHaveBeenCalledWith(1, {
      name: "Pro",
      monthly_price: 10,
      annual_price: null,
      publish_quota: 20,
    });
    expect(result.current.plans).toEqual([makePlan({ name: "Pro" })]);
  });

  test("GIVEN a loaded queue WHEN deactivate resolves THEN it refetches the plan list", async () => {
    mockedClient.listPlans.mockResolvedValue({ data: [makePlan()] });
    mockedClient.deactivatePlan.mockResolvedValue({ data: makePlan({ is_active: false }) });

    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listPlans.mockResolvedValue({ data: [makePlan({ is_active: false })] });
    await act(async () => {
      await result.current.deactivate(1);
    });

    expect(mockedClient.deactivatePlan).toHaveBeenCalledWith(1);
    expect(result.current.plans).toEqual([makePlan({ is_active: false })]);
  });
});

describe("useOrganizerSubscription", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN the hook mounts WHEN getSubscription resolves THEN it exposes the usage summary and stops loading", async () => {
    mockedClient.getSubscription.mockResolvedValue({ data: makeUsage() });

    const { result } = renderHook(() => useOrganizerSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.usage).toEqual(makeUsage());
    expect(result.current.error).toBeNull();
  });

  test("GIVEN getSubscription rejects WHEN the hook mounts THEN it surfaces the ApiError message and clears usage", async () => {
    mockedClient.getSubscription.mockRejectedValue(new ApiError(500, "Erro interno."));

    const { result } = renderHook(() => useOrganizerSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.usage).toBeNull();
    expect(result.current.error).toBe("Erro interno.");
  });
});
