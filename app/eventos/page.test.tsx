/**
 * Integration test for AT20's organizer event list page: exercises the
 * rendered page against a mocked global fetch (same technique as
 * app/aprovacoes/eventos/page.test.tsx and app/cadastro/local/page.test.tsx).
 *
 * Gotchas carried over from those files: (1) http.ts's CSRF-bootstrap flag is
 * module-level and only fires its GET once per test file, so mutating
 * requests are routed by URL/method rather than a fixed mockResolvedValueOnce
 * queue; (2) any fixture read via `.json()` across multiple fetch calls must
 * be a factory returning a fresh Response each time; (3) anchored regexes for
 * getByLabelText/getByRole(..., {name}) queries when label text could be a
 * substring of other visible text.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventsPage from "./page";

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

function meResponse(accountType: "venue_admin" | "promoter"): Response {
  return jsonResponse({
    data: { id: 1, name: "Organizador", email: "org@example.com", permissions: [], account_type: accountType },
  });
}

function venueResponse(approvalStatus: string): Response {
  return jsonResponse({
    data: {
      id: 10,
      name: "Casa X",
      description: "Descrição",
      address: "Rua A, 123",
      city: "vitoria",
      contact_phone: "27999990000",
      contact_email: "contato@casax.com",
      approval_status: approvalStatus,
      image_url: null,
    },
  });
}

function eventsResponse(events: unknown[]): Response {
  return jsonResponse({ data: events });
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

function stubFetch(opts: {
  accountType: "venue_admin" | "promoter";
  approvalStatus: string;
  events: unknown[];
  isAtLimit?: boolean;
  extra?: (url: string, init?: RequestInit) => Response | undefined;
}) {
  const fetchMock = vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/sanctum/csrf-cookie")) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const extra = opts.extra?.(url, init);
    if (extra) return Promise.resolve(extra);
    if (url.endsWith("/me") && !url.includes("venues") && !url.includes("promoters")) {
      return Promise.resolve(meResponse(opts.accountType));
    }
    if (url.includes("/venues/me")) {
      return Promise.resolve(venueResponse(opts.approvalStatus));
    }
    if (url.includes("/promoters/me")) {
      return Promise.resolve(
        jsonResponse({
          data: {
            id: 20,
            name: "Promoter X",
            contact_phone: "27999990000",
            contact_email: "promoter@example.com",
            instagram: null,
            tiktok: null,
            approval_status: opts.approvalStatus,
          },
        }),
      );
    }
    if (url.includes("/subscription")) {
      return Promise.resolve(subscriptionResponse(opts.isAtLimit ?? false));
    }
    if (url.includes("/events")) {
      return Promise.resolve(eventsResponse(opts.events));
    }
    return Promise.resolve(jsonResponse({ message: "not found" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("app/eventos/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a venue_admin whose account is still pending approval WHEN /eventos mounts THEN it shows the blocked notice instead of the event list", async () => {
    stubFetch({ accountType: "venue_admin", approvalStatus: "pending_approval", events: [] });

    render(<EventsPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/sua conta ainda está em análise/i),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/\+ novo evento/i)).not.toBeInTheDocument();
  });

  test("GIVEN an approved venue_admin with events of every status WHEN /eventos mounts THEN it renders the list with status-appropriate actions", async () => {
    const events = [
      baseEvent({ id: 1, title: "Show Rascunho", status: "draft" }),
      baseEvent({ id: 2, title: "Show Em Revisão", status: "pending_review" }),
      baseEvent({ id: 3, title: "Show Publicado", status: "published" }),
    ];
    stubFetch({ accountType: "venue_admin", approvalStatus: "approved", events });

    render(<EventsPage />);

    await waitFor(() => expect(screen.getByText("Show Rascunho")).toBeInTheDocument());
    expect(screen.getByText("Show Em Revisão")).toBeInTheDocument();
    expect(screen.getByText("Show Publicado")).toBeInTheDocument();

    expect(screen.getByText(/\+ novo evento/i)).toBeInTheDocument();
    expect(screen.getByText(/enviar para revisão/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^editar$/i).length).toBe(2);
    expect(screen.getByText(/^duplicar$/i)).toBeInTheDocument();
    expect(screen.getByText(/^cancelar$/i)).toBeInTheDocument();
  });

  test("GIVEN a draft event WHEN 'Enviar para revisão' is clicked THEN the submit endpoint is called for that event", async () => {
    const events = [baseEvent({ id: 5, title: "Show Rascunho", status: "draft" })];
    const fetchMock = stubFetch({
      accountType: "venue_admin",
      approvalStatus: "approved",
      events,
      extra: (url) => {
        if (url.includes("/events/5/submit")) {
          return jsonResponse({ data: baseEvent({ id: 5, title: "Show Rascunho", status: "pending_review" }) });
        }
        return undefined;
      },
    });

    render(<EventsPage />);

    await waitFor(() => expect(screen.getByText("Show Rascunho")).toBeInTheDocument());
    await userEvent.click(screen.getByText(/enviar para revisão/i));

    await waitFor(() => {
      const submitCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/events/5/submit"));
      expect(submitCall).toBeDefined();
    });
  });

  test("GIVEN an organizer already at their publish-quota limit WHEN /eventos mounts THEN it shows the at-limit banner without hiding the list", async () => {
    const events = [baseEvent({ id: 1, title: "Show Rascunho", status: "draft" })];
    stubFetch({ accountType: "venue_admin", approvalStatus: "approved", events, isAtLimit: true });

    render(<EventsPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Show Rascunho")).toBeInTheDocument();
    expect(screen.getByText(/\+ novo evento/i)).toBeInTheDocument();
  });

  test("GIVEN a draft event WHEN 'Enviar para revisão' rejects with quota_exceeded THEN it shows the at-limit banner instead of silently failing", async () => {
    const events = [baseEvent({ id: 5, title: "Show Rascunho", status: "draft" })];
    stubFetch({
      accountType: "venue_admin",
      approvalStatus: "approved",
      events,
      extra: (url) => {
        if (url.includes("/events/5/submit")) {
          return jsonResponse(
            { message: "Você atingiu o limite de publicações do seu plano", code: "quota_exceeded" },
            422,
          );
        }
        return undefined;
      },
    });

    render(<EventsPage />);

    await waitFor(() => expect(screen.getByText("Show Rascunho")).toBeInTheDocument());
    await userEvent.click(screen.getByText(/enviar para revisão/i));

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
  });

  test("GIVEN the events request fails WHEN /eventos mounts THEN it renders the pt-BR error message", async () => {
    stubFetch({
      accountType: "venue_admin",
      approvalStatus: "approved",
      events: [],
      extra: (url) => {
        if (url.includes("/events")) return jsonResponse({ message: "Erro ao carregar eventos." }, 500);
        return undefined;
      },
    });

    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText(/erro ao carregar eventos\./i)).toBeInTheDocument(),
    );
  });
});
