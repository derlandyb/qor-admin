import { act, renderHook, waitFor } from "@testing-library/react";

import { apiClient, ApiError } from "@/lib/api/client";
import { usePlans, useOrganizerSubscription } from "../useBilling";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ...actual,
    apiClient: {
      plans: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deactivate: jest.fn(),
      },
      subscription: {
        get: jest.fn(),
      },
    },
  };
});

const mockedApiClient = apiClient as unknown as {
  plans: { list: jest.Mock; create: jest.Mock; update: jest.Mock; deactivate: jest.Mock };
  subscription: { get: jest.Mock };
};

const plan1 = {
  id: 1,
  name: "Básico",
  monthly_price: 99,
  annual_price: null,
  publish_quota: 5,
  is_active: true,
  is_default_free: false,
};

const plan2 = {
  id: 2,
  name: "Pro",
  monthly_price: 199,
  annual_price: 1990,
  publish_quota: 20,
  is_active: true,
  is_default_free: false,
};

describe("usePlans", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN a plan list WHEN the hook mounts THEN it populates plans", async () => {
    mockedApiClient.plans.list.mockResolvedValue({ data: [plan1] });

    const { result } = renderHook(() => usePlans());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plans).toEqual([plan1]);
    expect(result.current.error).toBeNull();
    expect(mockedApiClient.plans.list).toHaveBeenCalledTimes(1);
  });

  test("GIVEN a rejected list call WHEN the hook mounts THEN error is set to the pt-BR ApiError message", async () => {
    mockedApiClient.plans.list.mockRejectedValue(new ApiError("Não autorizado.", 403));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Não autorizado.");
    expect(result.current.plans).toEqual([]);
  });

  test("GIVEN a rejected list call with a non-ApiError WHEN the hook mounts THEN error is set to the generic pt-BR fallback", async () => {
    mockedApiClient.plans.list.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Ocorreu um erro inesperado.");
  });

  test("GIVEN a valid payload WHEN create is called THEN it calls apiClient.plans.create and appends the new plan", async () => {
    mockedApiClient.plans.list.mockResolvedValue({ data: [plan1] });
    mockedApiClient.plans.create.mockResolvedValue({ data: plan2 });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload = { name: "Pro", monthly_price: 199, annual_price: 1990, publish_quota: 20 };

    let created;
    await act(async () => {
      created = await result.current.create(payload);
    });

    expect(mockedApiClient.plans.create).toHaveBeenCalledWith(payload);
    expect(created).toEqual(plan2);
    expect(result.current.plans).toEqual([plan1, plan2]);
  });

  test("GIVEN an id and payload WHEN update is called THEN it calls apiClient.plans.update and replaces the plan", async () => {
    mockedApiClient.plans.list.mockResolvedValue({ data: [plan1] });
    const updated = { ...plan1, name: "Básico Plus" };
    mockedApiClient.plans.update.mockResolvedValue({ data: updated });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload = { name: "Básico Plus", monthly_price: 99, publish_quota: 5 };

    await act(async () => {
      await result.current.update(1, payload);
    });

    expect(mockedApiClient.plans.update).toHaveBeenCalledWith(1, payload);
    expect(result.current.plans).toEqual([updated]);
  });

  test("GIVEN an id WHEN deactivate is called THEN it calls apiClient.plans.deactivate and replaces the plan", async () => {
    mockedApiClient.plans.list.mockResolvedValue({ data: [plan1] });
    const deactivated = { ...plan1, is_active: false };
    mockedApiClient.plans.deactivate.mockResolvedValue({ data: deactivated });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deactivate(1);
    });

    expect(mockedApiClient.plans.deactivate).toHaveBeenCalledWith(1);
    expect(result.current.plans).toEqual([deactivated]);
  });

  test("GIVEN a rejected create call WHEN create is called THEN error is set and plans are left untouched", async () => {
    mockedApiClient.plans.list.mockResolvedValue({ data: [plan1] });
    mockedApiClient.plans.create.mockRejectedValue(new ApiError("Dados inválidos.", 422));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.create({ name: "X", monthly_price: 1, publish_quota: 1 });
    });

    expect(created).toBeUndefined();
    expect(result.current.error).toBe("Dados inválidos.");
    expect(result.current.plans).toEqual([plan1]);
  });
});

describe("useOrganizerSubscription", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN a usage summary WHEN the hook mounts THEN it populates usage", async () => {
    const usage = {
      plan_name: "Pro",
      monthly_price: 199,
      publish_quota: 20,
      publishes_used_this_period: 5,
      is_at_limit: false,
    };
    mockedApiClient.subscription.get.mockResolvedValue({ data: usage });

    const { result } = renderHook(() => useOrganizerSubscription());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.usage).toEqual(usage);
    expect(result.current.error).toBeNull();
    expect(mockedApiClient.subscription.get).toHaveBeenCalledTimes(1);
  });

  test("GIVEN a rejected fetch WHEN the hook mounts THEN error is set to the pt-BR ApiError message", async () => {
    mockedApiClient.subscription.get.mockRejectedValue(new ApiError("Assinatura não encontrada.", 404));

    const { result } = renderHook(() => useOrganizerSubscription());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Assinatura não encontrada.");
    expect(result.current.usage).toBeNull();
  });
});
