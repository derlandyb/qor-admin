import { describe, expect, test, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAccountApprovalQueue, useEventApprovalQueue } from "./useApprovalQueues";
import * as client from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { PendingAccount, Event, Paginated } from "../lib/api/types";

vi.mock("../lib/api/client");

const mockedClient = vi.mocked(client);

function makePendingAccountsPage(overrides?: Partial<Paginated<PendingAccount>>): Paginated<PendingAccount> {
  return {
    data: [
      { type: "venue", id: 1, name: "Casa X", contact_phone: "1", contact_email: "a@a.com", city: "vitoria" as never },
    ],
    current_page: 1,
    per_page: 10,
    total: 1,
    ...overrides,
  };
}

function makeEventsPage(overrides?: Partial<Paginated<Event>>): Paginated<Event> {
  return {
    data: [
      {
        id: 1,
        title: "Show",
        description: "desc",
        cover_image_url: null,
        starts_at: "2026-01-01",
        city: "vitoria" as never,
        genre_id: 1,
        address: null,
        is_free: false,
        ticket_url: null,
        capacity: null,
        age_rating: null,
        notes: null,
        status: "pending_review" as never,
        rejection_feedback: null,
        created_by_type: "promoter" as never,
        created_by_id: 1,
        promoters: [],
      },
    ],
    current_page: 1,
    per_page: 10,
    total: 1,
    ...overrides,
  };
}

describe("useAccountApprovalQueue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN the hook mounts WHEN listPendingAccounts resolves THEN it exposes the accounts and stops loading", async () => {
    mockedClient.listPendingAccounts.mockResolvedValue(makePendingAccountsPage());

    const { result } = renderHook(() => useAccountApprovalQueue());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(mockedClient.listPendingAccounts).toHaveBeenCalledWith(1);
  });

  test("GIVEN listPendingAccounts rejects with an ApiError WHEN the hook fetches THEN it surfaces the error message", async () => {
    mockedClient.listPendingAccounts.mockRejectedValue(new ApiError(422, "Dados inválidos."));

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Dados inválidos.");
    expect(result.current.accounts).toEqual([]);
  });

  test("GIVEN setPage is called WHEN the page changes THEN it refetches with the new page", async () => {
    mockedClient.listPendingAccounts.mockResolvedValue(makePendingAccountsPage({ current_page: 2 }));

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(mockedClient.listPendingAccounts).toHaveBeenCalledWith(2));
  });

  test("GIVEN decide is called WHEN decideAccountApproval resolves THEN it refetches the current page", async () => {
    mockedClient.listPendingAccounts.mockResolvedValue(makePendingAccountsPage());
    mockedClient.decideAccountApproval.mockResolvedValue({
      data: {
        id: 1,
        decidable_type: "venue",
        decidable_id: 1,
        outcome: "approved",
        reason: null,
        decided_by: 1,
        decided_at: "2026-01-01",
      },
    });

    const { result } = renderHook(() => useAccountApprovalQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.decide("venue", 1, { outcome: "approved" });
    });

    expect(mockedClient.decideAccountApproval).toHaveBeenCalledWith("venue", 1, { outcome: "approved" });
    expect(mockedClient.listPendingAccounts).toHaveBeenCalledTimes(2);
  });
});

describe("useEventApprovalQueue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN the hook mounts WHEN listPendingEvents resolves THEN it exposes the events and stops loading", async () => {
    mockedClient.listPendingEvents.mockResolvedValue(makeEventsPage());

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.totalPages).toBe(1);
    expect(mockedClient.listPendingEvents).toHaveBeenCalledWith(1);
  });

  test("GIVEN listPendingEvents rejects WHEN the hook fetches THEN it surfaces the error message", async () => {
    mockedClient.listPendingEvents.mockRejectedValue(new ApiError(500, "Erro inesperado."));

    const { result } = renderHook(() => useEventApprovalQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Erro inesperado.");
    expect(result.current.events).toEqual([]);
  });

  test("GIVEN decide is called WHEN decideEventApproval resolves THEN it refetches the current page", async () => {
    mockedClient.listPendingEvents.mockResolvedValue(makeEventsPage());
    mockedClient.decideEventApproval.mockResolvedValue({
      data: {
        id: 1,
        decidable_type: "event",
        decidable_id: 1,
        outcome: "approved",
        reason: null,
        decided_by: 1,
        decided_at: "2026-01-01",
      },
    });

    const { result } = renderHook(() => useEventApprovalQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.decide(1, { outcome: "approved" });
    });

    expect(mockedClient.decideEventApproval).toHaveBeenCalledWith(1, { outcome: "approved" });
    expect(mockedClient.listPendingEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN setPage is called WHEN the page changes THEN it refetches with the new page", async () => {
    mockedClient.listPendingEvents.mockResolvedValue(makeEventsPage({ current_page: 3 }));

    const { result } = renderHook(() => useEventApprovalQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => expect(mockedClient.listPendingEvents).toHaveBeenCalledWith(3));
  });
});
