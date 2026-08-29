import { act, renderHook, waitFor } from "@testing-library/react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { CreateEventPayload, QorEvent } from "@/lib/api/types";

import { useOrganizerEvents } from "../useOrganizerEvents";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ApiError: actual.ApiError,
    apiClient: {
      events: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        submit: jest.fn(),
        duplicate: jest.fn(),
        cancel: jest.fn(),
        remove: jest.fn(),
      },
    },
  };
});

function buildEvent(overrides: Partial<QorEvent> = {}): QorEvent {
  return {
    id: 1,
    title: "Show de Rock",
    description: "desc",
    cover_image_url: null,
    starts_at: "2026-09-01T22:00:00Z",
    city: "vitoria",
    genre_id: 1,
    address: null,
    is_free: false,
    ticket_url: null,
    capacity: null,
    age_rating: null,
    notes: null,
    status: "draft",
    created_by_type: "venue_admin",
    created_by_id: 1,
    ...overrides,
  };
}

describe("useOrganizerEvents", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GIVEN the hook mounts WHEN the initial fetch succeeds THEN it populates events and clears isLoading", async () => {
    const events = [buildEvent({ id: 1 }), buildEvent({ id: 2 })];
    (apiClient.events.list as jest.Mock).mockResolvedValue({ data: events });

    const { result } = renderHook(() => useOrganizerEvents());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events).toEqual(events);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN the hook mounts WHEN the initial fetch fails THEN it sets error", async () => {
    (apiClient.events.list as jest.Mock).mockRejectedValue(new ApiError("Falha ao carregar eventos.", 500));

    const { result } = renderHook(() => useOrganizerEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Falha ao carregar eventos.");
    expect(result.current.events).toEqual([]);
  });

  test("GIVEN a loaded list WHEN create succeeds THEN it calls the client with the payload and appends the new event", async () => {
    (apiClient.events.list as jest.Mock).mockResolvedValue({ data: [] });
    const created = buildEvent({ id: 5, title: "Novo Show" });
    (apiClient.events.create as jest.Mock).mockResolvedValue({ data: created });

    const { result } = renderHook(() => useOrganizerEvents());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const payload: CreateEventPayload = {
      title: "Novo Show",
      description: "desc",
      starts_at: "2026-09-01T22:00:00Z",
      city: "vitoria",
      genre_id: 1,
      is_free: false,
    };

    await act(async () => {
      await result.current.create(payload);
    });

    expect(apiClient.events.create).toHaveBeenCalledWith(payload);
    expect(result.current.events).toContainEqual(created);
  });

  test("GIVEN a loaded list WHEN submit succeeds THEN it calls the client with the id and updates the local event", async () => {
    const draft = buildEvent({ id: 1, status: "draft" });
    (apiClient.events.list as jest.Mock).mockResolvedValue({ data: [draft] });
    const submitted = buildEvent({ id: 1, status: "pending_review" });
    (apiClient.events.submit as jest.Mock).mockResolvedValue({ data: submitted });

    const { result } = renderHook(() => useOrganizerEvents());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.submit(1);
    });

    expect(apiClient.events.submit).toHaveBeenCalledWith(1);
    expect(result.current.events).toEqual([submitted]);
  });

  test("GIVEN a loaded list WHEN cancel succeeds THEN it calls the client with the id and updates the local event", async () => {
    const published = buildEvent({ id: 1, status: "published" });
    (apiClient.events.list as jest.Mock).mockResolvedValue({ data: [published] });
    const cancelled = buildEvent({ id: 1, status: "cancelled" });
    (apiClient.events.cancel as jest.Mock).mockResolvedValue({ data: cancelled });

    const { result } = renderHook(() => useOrganizerEvents());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel(1);
    });

    expect(apiClient.events.cancel).toHaveBeenCalledWith(1);
    expect(result.current.events).toEqual([cancelled]);
  });

  test("GIVEN a loaded list WHEN remove succeeds THEN it calls the client and removes the event locally", async () => {
    const event = buildEvent({ id: 1 });
    (apiClient.events.list as jest.Mock).mockResolvedValue({ data: [event] });
    (apiClient.events.remove as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOrganizerEvents());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(apiClient.events.remove).toHaveBeenCalledWith(1);
    expect(result.current.events).toEqual([]);
  });
});
