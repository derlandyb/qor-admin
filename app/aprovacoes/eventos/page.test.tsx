/**
 * Integration test for AT17's event-approval queue page: exercises the
 * rendered page against a mocked global fetch (same technique as
 * app/aprovacoes/contas/page.test.tsx).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventApprovalsPage from "./page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pendingEventsPage(): Response {
  return jsonResponse({
    data: [
      {
        id: 1,
        title: "Show Futuro",
        description: "Descrição do show futuro.",
        cover_image_url: null,
        starts_at: "2099-12-31T22:00:00Z",
        city: "vitoria",
        genre_id: 1,
        address: "Rua A",
        is_free: false,
        ticket_url: "https://ingressos.example.com/show-futuro",
        capacity: 500,
        age_rating: "18",
        notes: null,
        status: "pending_review",
        rejection_feedback: null,
        created_by_type: "promoter",
        created_by_id: 2,
        promoters: [],
      },
      {
        id: 2,
        title: "Show Passado",
        description: "Descrição do show passado.",
        cover_image_url: null,
        starts_at: "2020-01-01T20:00:00Z",
        city: "serra",
        genre_id: 2,
        address: "Rua B",
        is_free: true,
        ticket_url: null,
        capacity: null,
        age_rating: null,
        notes: null,
        status: "pending_review",
        rejection_feedback: null,
        created_by_type: "venue_admin",
        created_by_id: 3,
        promoters: [],
      },
    ],
    current_page: 1,
    per_page: 10,
    total: 2,
  });
}

describe("app/aprovacoes/eventos/page.tsx (integration, real hook + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN pending events including one with a past date WHEN the page mounts THEN it renders the queue and flags the past-date event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(pendingEventsPage())),
    );

    render(<EventApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Show Futuro")).toBeInTheDocument());
    expect(screen.getByText("Show Passado")).toBeInTheDocument();
    expect(screen.getByText(/data já passou/i)).toBeInTheDocument();
    expect(screen.getAllByText(/aprovar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/rejeitar/i).length).toBeGreaterThan(0);
  });

  test("GIVEN a pending event WHEN Aprovar is confirmed without feedback THEN decide() sends outcome approved and feedback null", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/decide")) {
        return Promise.resolve(jsonResponse({ data: { id: 1 } }));
      }
      return Promise.resolve(pendingEventsPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EventApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Show Futuro")).toBeInTheDocument());

    const approveButtons = screen.getAllByText(/aprovar/i);
    await userEvent.click(approveButtons[0]!);

    const confirmButton = await screen.findByRole("button", { name: /confirmar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"));
      expect(decideCall).toBeDefined();
    });

    const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"))!;
    const [decideUrl, decideInit] = decideCall;
    expect(String(decideUrl)).toContain("/approvals/events/1/decide");
    const body = JSON.parse(decideInit.body as string);
    expect(body).toEqual({ outcome: "approved", feedback: null });
  });

  test("GIVEN a pending event WHEN Rejeitar is confirmed with typed feedback THEN decide() sends outcome rejected and the feedback", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/decide")) {
        return Promise.resolve(jsonResponse({ data: { id: 2 } }));
      }
      return Promise.resolve(pendingEventsPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EventApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Show Passado")).toBeInTheDocument());

    const rejectButtons = screen.getAllByText(/rejeitar/i);
    await userEvent.click(rejectButtons[1]!);

    const feedbackField = await screen.findByLabelText(/feedback/i);
    await userEvent.type(feedbackField, "Evento com data expirada.");

    const confirmButton = screen.getByRole("button", { name: /confirmar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"));
      expect(decideCall).toBeDefined();
    });

    const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"))!;
    const [decideUrl, decideInit] = decideCall;
    expect(String(decideUrl)).toContain("/approvals/events/2/decide");
    const body = JSON.parse(decideInit.body as string);
    expect(body).toEqual({ outcome: "rejected", feedback: "Evento com data expirada." });
  });

  test("GIVEN the server rejects the request WHEN the page mounts THEN it renders the pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Acesso negado." }, 403)),
    );

    render(<EventApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Acesso negado.")).toBeInTheDocument());
  });
});
