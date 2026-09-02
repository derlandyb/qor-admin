/**
 * Integration test for AT20's organizer event edit page (the app's first
 * dynamic route). Same gotchas as app/eventos/page.test.tsx. There is no
 * single-event GET endpoint — the page finds the event to edit inside
 * useEvents()'s listEvents() result, so the fixture always stubs /events
 * with a list containing (or, for the not-found case, omitting) the id
 * under test.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditEventPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function baseEvent(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    title: "Show A",
    description: "Descrição do show.",
    cover_image_url: null,
    starts_at: "2099-12-31T22:00:00Z",
    city: "vitoria",
    genre_id: 1,
    address: "Rua A",
    is_free: false,
    ticket_url: "https://ingressos.example.com/a",
    capacity: null,
    age_rating: null,
    notes: null,
    status: "draft",
    rejection_feedback: null,
    created_by_type: "venue_admin",
    created_by_id: 10,
    promoters: [],
    ...overrides,
  };
}

function subscriptionResponse(isAtLimit: boolean): Response {
  return jsonResponse({
    data: {
      plan_name: "Gratuito",
      monthly_price: 0,
      publish_quota: 5,
      publishes_used_this_period: isAtLimit ? 5 : 2,
      is_at_limit: isAtLimit,
    },
  });
}

function stubFetch(
  events: unknown[],
  extra?: (url: string, init?: RequestInit) => Response | undefined,
  isAtLimit = false,
) {
  const fetchMock = vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/sanctum/csrf-cookie")) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const extraResponse = extra?.(url, init);
    if (extraResponse) return Promise.resolve(extraResponse);
    if (url.includes("/subscription")) {
      return Promise.resolve(subscriptionResponse(isAtLimit));
    }
    if (url.includes("/events")) {
      return Promise.resolve(jsonResponse({ data: events }));
    }
    return Promise.resolve(jsonResponse({ message: "not found" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("app/eventos/[id]/editar/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN the organizer's own event exists WHEN /eventos/1/editar mounts THEN it renders EventForm pre-filled with that event's fields", async () => {
    const events = [baseEvent({ id: 1, title: "Show A" })];
    stubFetch(events);

    render(<EditEventPage params={Promise.resolve({ id: "1" })} />);

    const titleInput = await screen.findByLabelText(/^título$/i);
    expect(titleInput).toHaveValue("Show A");
    expect(screen.getByLabelText(/^endereço/i)).toHaveValue("Rua A");
  });

  test("GIVEN no event with the given id in the organizer's list WHEN /eventos/999/editar mounts THEN it shows a pt-BR not-found state", async () => {
    stubFetch([baseEvent({ id: 1, title: "Show A" })]);

    render(<EditEventPage params={Promise.resolve({ id: "999" })} />);

    await waitFor(() =>
      expect(screen.getByText(/evento não encontrado/i)).toBeInTheDocument(),
    );
  });

  test("GIVEN an edited form WHEN submitted THEN it PATCHes the event and redirects to /eventos", async () => {
    const events = [baseEvent({ id: 1, title: "Show A" })];
    const fetchMock = stubFetch(events, (url, init) => {
      if (url.includes("/events/1") && init?.method === "POST") {
        return jsonResponse({ data: baseEvent({ id: 1, title: "Show A Editado" }) });
      }
      return undefined;
    });

    render(<EditEventPage params={Promise.resolve({ id: "1" })} />);

    const titleInput = await screen.findByLabelText(/^título$/i);
    const user = userEvent.setup();
    await user.clear(titleInput);
    await user.type(titleInput, "Show A Editado");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/eventos"));
    const editCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes("/events/1") && (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(editCall).toBeDefined();
  });

  test("GIVEN an organizer already at their publish-quota limit WHEN /eventos/1/editar mounts THEN it shows the at-limit banner instead of the form", async () => {
    stubFetch([baseEvent({ id: 1, title: "Show A" })], undefined, true);

    render(<EditEventPage params={Promise.resolve({ id: "1" })} />);

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText(/^título$/i)).not.toBeInTheDocument();
  });

  test("GIVEN quota is exceeded between page load and submit WHEN edit rejects with quota_exceeded THEN it shows the at-limit banner instead of a generic error", async () => {
    const events = [baseEvent({ id: 1, title: "Show A" })];
    stubFetch(events, (url, init) => {
      if (url.includes("/events/1") && init?.method === "POST") {
        return jsonResponse(
          { message: "Você atingiu o limite de publicações do seu plano", code: "quota_exceeded" },
          422,
        );
      }
      return undefined;
    });

    render(<EditEventPage params={Promise.resolve({ id: "1" })} />);

    const titleInput = await screen.findByLabelText(/^título$/i);
    const user = userEvent.setup();
    await user.clear(titleInput);
    await user.type(titleInput, "Show A Editado");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Erro ao salvar o evento.")).not.toBeInTheDocument();
  });
});
