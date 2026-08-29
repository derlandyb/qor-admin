import { act, renderHook, waitFor } from "@testing-library/react";

import type { CreateEventPayload, QorEvent } from "@/lib/api/types";

import { useOrganizerEvents } from "../useOrganizerEvents";

/**
 * Integration tests for useOrganizerEvents: unlike useOrganizerEvents.test.ts
 * (which mocks `apiClient` directly), these mock the network boundary
 * (`global.fetch`) and exercise the real, un-mocked `apiClient` together
 * with the hook.
 */

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

function jsonResponse(status: number, body: unknown) {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  };
}

describe("useOrganizerEvents (integration)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GIVEN fetch resolves the initial GET with a list WHEN the hook mounts THEN events populates from the response", async () => {
    const events = [buildEvent({ id: 1 }), buildEvent({ id: 2 })];
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, { data: events }));

    const { result } = renderHook(() => useOrganizerEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/events", expect.any(Object));
    expect(result.current.events).toEqual(events);
    expect(result.current.error).toBeNull();
  });

  test("GIVEN a loaded list WHEN create is called THEN fetch is sent with a FormData body to the events endpoint and events state updates", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, { data: [] }));
    const created = buildEvent({ id: 5, title: "Novo Show" });
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, { data: created }));

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

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [secondUrl, secondInit] = (global.fetch as jest.Mock).mock.calls[1];
    expect(secondUrl).toBe("/api/admin/events");
    expect(secondInit.method).toBe("POST");
    expect(secondInit.body).toBeInstanceOf(FormData);
    expect((secondInit.body as FormData).get("title")).toBe("Novo Show");

    expect(result.current.events).toContainEqual(created);
  });
});
