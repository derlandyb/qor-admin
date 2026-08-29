import { act, renderHook, waitFor } from "@testing-library/react";

import { apiClient, ApiError } from "@/lib/api/client";
import { useAccountApprovalQueue, useEventApprovalQueue } from "../useApprovalQueues";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ...actual,
    apiClient: {
      accountApprovals: {
        list: jest.fn(),
        decide: jest.fn(),
      },
      eventApprovals: {
        list: jest.fn(),
        decide: jest.fn(),
      },
    },
  };
});

const mockedApiClient = apiClient as unknown as {
  accountApprovals: { list: jest.Mock; decide: jest.Mock };
  eventApprovals: { list: jest.Mock; decide: jest.Mock };
};

describe("useAccountApprovalQueue", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN a pending account list WHEN the hook mounts THEN it populates accounts, total and perPage", async () => {
    mockedApiClient.accountApprovals.list.mockResolvedValue({
      data: [{ id: 1, type: "venue", name: "Casa Show", contact_email: "a@b.com", contact_phone: "27999999999" }],
      current_page: 1,
      per_page: 15,
      total: 1,
    });

    const { result } = renderHook(() => useAccountApprovalQueue());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.perPage).toBe(15);
    expect(result.current.error).toBeNull();
    expect(mockedApiClient.accountApprovals.list).toHaveBeenCalledWith(1);
  });

  test("GIVEN a rejected list call WHEN the hook mounts THEN error is set to the pt-BR ApiError message", async () => {
    mockedApiClient.accountApprovals.list.mockRejectedValue(new ApiError("Não autorizado.", 403));

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Não autorizado.");
    expect(result.current.accounts).toEqual([]);
  });

  test("GIVEN a pending account WHEN decide is called THEN it calls apiClient.accountApprovals.decide with correct args and refetches", async () => {
    mockedApiClient.accountApprovals.list
      .mockResolvedValueOnce({
        data: [{ id: 1, type: "venue", name: "Casa Show", contact_email: "a@b.com", contact_phone: "27999999999" }],
        current_page: 1,
        per_page: 15,
        total: 1,
      })
      .mockResolvedValueOnce({ data: [], current_page: 1, per_page: 15, total: 0 });
    mockedApiClient.accountApprovals.decide.mockResolvedValue({
      data: { id: 1, decidable_type: "venue", decidable_id: 1, outcome: "approved", reason: null, decided_by: 9, decided_at: "now" },
    });

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.decide("venue", 1, "approved");
    });

    expect(mockedApiClient.accountApprovals.decide).toHaveBeenCalledWith("venue", 1, {
      outcome: "approved",
      reason: undefined,
    });
    expect(mockedApiClient.accountApprovals.list).toHaveBeenCalledTimes(2);

    await waitFor(() => expect(result.current.accounts).toEqual([]));
  });

  test("GIVEN a page prop change WHEN the hook re-renders THEN it refetches with the new page", async () => {
    mockedApiClient.accountApprovals.list.mockResolvedValue({
      data: [],
      current_page: 1,
      per_page: 15,
      total: 0,
    });

    const { result, rerender } = renderHook(({ page }) => useAccountApprovalQueue(page), {
      initialProps: { page: 1 },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ page: 2 });

    await waitFor(() => expect(mockedApiClient.accountApprovals.list).toHaveBeenCalledWith(2));
  });
});

describe("useEventApprovalQueue", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN a pending event list WHEN the hook mounts THEN it populates events, total and perPage", async () => {
    mockedApiClient.eventApprovals.list.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Show X",
          description: "desc",
          cover_image_url: null,
          starts_at: "2026-09-01T20:00:00Z",
          city: "vitoria",
          genre_id: 1,
          address: null,
          is_free: true,
          ticket_url: null,
          capacity: null,
          age_rating: null,
          notes: null,
          status: "pending_review",
          created_by_type: "venue_admin",
          created_by_id: 1,
        },
      ],
      current_page: 1,
      per_page: 15,
      total: 1,
    });

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.perPage).toBe(15);
    expect(result.current.error).toBeNull();
    expect(mockedApiClient.eventApprovals.list).toHaveBeenCalledWith(1);
  });

  test("GIVEN a rejected list call WHEN the hook mounts THEN error is set to the pt-BR ApiError message", async () => {
    mockedApiClient.eventApprovals.list.mockRejectedValue(new ApiError("Sessão expirada.", 401));

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Sessão expirada.");
    expect(result.current.events).toEqual([]);
  });

  test("GIVEN a pending event WHEN decide is called THEN it calls apiClient.eventApprovals.decide with correct args and refetches", async () => {
    mockedApiClient.eventApprovals.list
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: "Show X",
            description: "desc",
            cover_image_url: null,
            starts_at: "2026-09-01T20:00:00Z",
            city: "vitoria",
            genre_id: 1,
            address: null,
            is_free: true,
            ticket_url: null,
            capacity: null,
            age_rating: null,
            notes: null,
            status: "pending_review",
            created_by_type: "venue_admin",
            created_by_id: 1,
          },
        ],
        current_page: 1,
        per_page: 15,
        total: 1,
      })
      .mockResolvedValueOnce({ data: [], current_page: 1, per_page: 15, total: 0 });
    mockedApiClient.eventApprovals.decide.mockResolvedValue({
      data: { id: 1, decidable_type: "event", decidable_id: 1, outcome: "rejected", reason: null, decided_by: 9, decided_at: "now" },
    });

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.decide(1, "rejected", "Faltam informações.");
    });

    expect(mockedApiClient.eventApprovals.decide).toHaveBeenCalledWith(1, {
      outcome: "rejected",
      feedback: "Faltam informações.",
    });
    expect(mockedApiClient.eventApprovals.list).toHaveBeenCalledTimes(2);

    await waitFor(() => expect(result.current.events).toEqual([]));
  });
});
