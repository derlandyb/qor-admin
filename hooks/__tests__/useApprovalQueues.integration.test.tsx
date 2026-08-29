import { act, renderHook, waitFor } from "@testing-library/react";

import type { Paginated, PendingAccount, QorEvent } from "@/lib/api/types";
import { ApprovalDecidableType, ApprovalOutcome, EventCreatedByType, EventStatus } from "@/lib/enums";
import { useAccountApprovalQueue, useEventApprovalQueue } from "../useApprovalQueues";

/**
 * Integration tests: unlike useApprovalQueues.test.ts (which mocks apiClient
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

describe("useAccountApprovalQueue (integration, real apiClient + fetch)", () => {
  test("GIVEN a paginated accounts response WHEN the hook mounts THEN accounts/total/perPage are populated via the real apiClient", async () => {
    const pending: Paginated<PendingAccount> = {
      data: [
        {
          id: 1,
          type: ApprovalDecidableType.Venue,
          name: "Casa Show",
          contact_email: "a@b.com",
          contact_phone: "27999999999",
        },
      ],
      current_page: 1,
      per_page: 15,
      total: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(200, pending));

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.accounts).toEqual(pending.data);
    expect(result.current.total).toBe(1);
    expect(result.current.perPage).toBe(15);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/approvals/accounts?page=1",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
  });

  test("GIVEN decide is called WHEN it resolves THEN fetch hits the decide endpoint and a refetch follows", async () => {
    const firstPage: Paginated<PendingAccount> = {
      data: [
        {
          id: 1,
          type: ApprovalDecidableType.Venue,
          name: "Casa Show",
          contact_email: "a@b.com",
          contact_phone: "27999999999",
        },
      ],
      current_page: 1,
      per_page: 15,
      total: 1,
    };
    const secondPage: Paginated<PendingAccount> = { data: [], current_page: 1, per_page: 15, total: 0 };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, firstPage))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            id: 1,
            decidable_type: ApprovalDecidableType.Venue,
            decidable_id: 1,
            outcome: ApprovalOutcome.Approved,
            reason: null,
            decided_by: 9,
            decided_at: "2026-08-29T00:00:00Z",
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, secondPage));

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.decide("venue", 1, ApprovalOutcome.Approved, "Tudo certo.");
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/approvals/accounts/venue/1/decide",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ outcome: ApprovalOutcome.Approved, reason: "Tudo certo." }),
      }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(3, "/api/admin/approvals/accounts?page=1", expect.anything());

    await waitFor(() => expect(result.current.accounts).toEqual([]));
  });

  test("GIVEN a non-2xx response with a pt-BR message WHEN the hook mounts THEN error is set from the thrown ApiError", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { message: "Não autorizado." }));

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Não autorizado.");
    expect(result.current.accounts).toEqual([]);
  });
});

describe("useEventApprovalQueue (integration, real apiClient + fetch)", () => {
  const sampleEvent: QorEvent = {
    id: 1,
    title: "Show X",
    description: "desc",
    cover_image_url: null,
    starts_at: "2026-09-01T20:00:00Z",
    city: "vitoria" as QorEvent["city"],
    genre_id: 1,
    address: null,
    is_free: true,
    ticket_url: null,
    capacity: null,
    age_rating: null,
    notes: null,
    status: EventStatus.PendingReview,
    created_by_type: EventCreatedByType.VenueAdmin,
    created_by_id: 1,
  };

  test("GIVEN a paginated events response WHEN the hook mounts THEN events/total/perPage are populated via the real apiClient", async () => {
    const pending: Paginated<QorEvent> = {
      data: [sampleEvent],
      current_page: 1,
      per_page: 15,
      total: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(200, pending));

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toEqual(pending.data);
    expect(result.current.total).toBe(1);
    expect(result.current.perPage).toBe(15);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/approvals/events?page=1",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
  });

  test("GIVEN decide is called WHEN it resolves THEN fetch hits the decide endpoint and a refetch follows", async () => {
    const firstPage: Paginated<QorEvent> = { data: [sampleEvent], current_page: 1, per_page: 15, total: 1 };
    const secondPage: Paginated<QorEvent> = { data: [], current_page: 1, per_page: 15, total: 0 };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, firstPage))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            id: 1,
            decidable_type: ApprovalDecidableType.Event,
            decidable_id: 1,
            outcome: ApprovalOutcome.Rejected,
            reason: "Faltam informações.",
            decided_by: 9,
            decided_at: "2026-08-29T00:00:00Z",
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, secondPage));

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.decide(1, ApprovalOutcome.Rejected, "Faltam informações.");
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/approvals/events/1/decide",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ outcome: ApprovalOutcome.Rejected, feedback: "Faltam informações." }),
      }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(3, "/api/admin/approvals/events?page=1", expect.anything());

    await waitFor(() => expect(result.current.events).toEqual([]));
  });

  test("GIVEN a non-2xx response with a pt-BR message WHEN the hook mounts THEN error is set from the thrown ApiError", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(422, { message: "Dados inválidos." }));

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Dados inválidos.");
    expect(result.current.events).toEqual([]);
  });
});
