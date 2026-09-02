/**
 * Integration test for AT11's hooks: unlike useApprovalQueues.test.ts (which
 * mocks lib/api/client.ts directly), this exercises the real hook -> client
 * -> http.ts stack against a mocked global fetch, the same technique
 * lib/api/client.test.ts uses — catching request/response-shape mismatches a
 * client-mocked unit test can't.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAccountApprovalQueue, useEventApprovalQueue } from "../useApprovalQueues";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("approval-queue hooks (integration, real client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a pending-accounts page WHEN useAccountApprovalQueue() mounts THEN it fetches /approvals/accounts and exposes the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            type: "venue",
            id: 1,
            name: "Casa X",
            contact_phone: "1",
            contact_email: "a@a.com",
            city: "vitoria",
          },
        ],
        current_page: 1,
        per_page: 10,
        total: 1,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.error).toBeNull();
    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/approvals/accounts");
  });

  test("GIVEN the server rejects the request WHEN useAccountApprovalQueue() mounts THEN error surfaces the pt-BR message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Acesso negado." }, 403)),
    );

    const { result } = renderHook(() => useAccountApprovalQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.accounts).toEqual([]);
    expect(result.current.error).toBe("Acesso negado.");
  });

  test("GIVEN a pending account WHEN decide() is called THEN it POSTs the decision then refetches the queue", async () => {
    const listPage = jsonResponse({
      data: [],
      current_page: 1,
      per_page: 10,
      total: 0,
    });
    // A mutating request (decide's POST) triggers http.ts's one-time
    // /sanctum/csrf-cookie bootstrap first — accounted for as its own call.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(listPage) // initial mount fetch (GET, no CSRF bootstrap)
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // /sanctum/csrf-cookie bootstrap
      .mockResolvedValueOnce(jsonResponse({ data: { id: 1 } })) // decide POST
      .mockResolvedValueOnce(listPage); // refetch after decide
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAccountApprovalQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.decide("venue", 1, { outcome: "approved" });
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [decideUrl, decideInit] = fetchMock.mock.calls[2]!;
    expect(String(decideUrl)).toContain("/approvals/accounts/venue/1/decide");
    expect(decideInit.method).toBe("POST");
  });

  test("GIVEN a pending-events page WHEN useEventApprovalQueue() mounts THEN it fetches /approvals/events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useEventApprovalQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const [url] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/api/admin/v1/approvals/events");
  });
});
