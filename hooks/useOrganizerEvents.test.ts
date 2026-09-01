import { describe, expect, test, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useEvents } from "./useOrganizerEvents";
import * as client from "../lib/api/client";
import { ApiError } from "../lib/api/http";
import type { Event } from "../lib/api/types";

vi.mock("../lib/api/client");

const mockedClient = vi.mocked(client);

function makeEvent(overrides?: Partial<Event>): Event {
  return {
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
    status: "draft" as never,
    rejection_feedback: null,
    created_by_type: "promoter" as never,
    created_by_id: 1,
    promoters: [],
    ...overrides,
  };
}

const createFields = {
  title: "Show",
  description: "desc",
  starts_at: "2026-01-01",
  city: "vitoria" as never,
  genre_id: 1,
  is_free: false,
};

describe("useEvents", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("GIVEN the hook mounts WHEN listEvents resolves THEN it exposes the events and stops loading", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [makeEvent()] });

    const { result } = renderHook(() => useEvents());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(1);
  });

  test("GIVEN listEvents rejects with an ApiError WHEN the hook fetches THEN it surfaces the error message", async () => {
    mockedClient.listEvents.mockRejectedValue(new ApiError(500, "Erro inesperado."));

    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Erro inesperado.");
    expect(result.current.events).toEqual([]);
  });

  test("GIVEN create is called WHEN createEvent resolves THEN it returns the event and refetches the list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [] });
    mockedClient.createEvent.mockResolvedValue({ data: makeEvent() });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: Event | undefined;
    await act(async () => {
      created = await result.current.create(createFields);
    });

    expect(created).toEqual(makeEvent());
    expect(mockedClient.createEvent).toHaveBeenCalledWith(createFields);
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN edit is called WHEN editEvent resolves THEN it returns the event and refetches the list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [] });
    mockedClient.editEvent.mockResolvedValue({ data: makeEvent({ title: "Updated" }) });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let edited: Event | undefined;
    await act(async () => {
      edited = await result.current.edit(1, { title: "Updated" });
    });

    expect(edited).toEqual(makeEvent({ title: "Updated" }));
    expect(mockedClient.editEvent).toHaveBeenCalledWith(1, { title: "Updated" });
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN submit is called WHEN submitEventForReview resolves THEN it refetches the list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [] });
    mockedClient.submitEventForReview.mockResolvedValue({ data: makeEvent({ status: "pending_review" as never }) });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submit(1);
    });

    expect(mockedClient.submitEventForReview).toHaveBeenCalledWith(1);
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN duplicate is called WHEN duplicateEvent resolves THEN it refetches the list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [] });
    mockedClient.duplicateEvent.mockResolvedValue({ data: makeEvent({ id: 2 }) });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.duplicate(1, "2026-02-01");
    });

    expect(mockedClient.duplicateEvent).toHaveBeenCalledWith(1, "2026-02-01");
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN cancel is called WHEN cancelEvent resolves THEN it refetches the list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [] });
    mockedClient.cancelEvent.mockResolvedValue({ data: makeEvent({ status: "cancelled" as never }) });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.cancel(1);
    });

    expect(mockedClient.cancelEvent).toHaveBeenCalledWith(1);
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN remove is called WHEN deleteEvent resolves THEN it refetches the list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [] });
    mockedClient.deleteEvent.mockResolvedValue({ message: "ok" });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mockedClient.deleteEvent).toHaveBeenCalledWith(1);
    expect(mockedClient.listEvents).toHaveBeenCalledTimes(2);
  });

  test("GIVEN refetch is called directly WHEN listEvents resolves THEN it updates the events list", async () => {
    mockedClient.listEvents.mockResolvedValue({ data: [makeEvent()] });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedClient.listEvents.mockResolvedValue({ data: [makeEvent(), makeEvent({ id: 2 })] });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.events).toHaveLength(2);
  });
});
