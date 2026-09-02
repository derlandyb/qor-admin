/**
 * Integration test for AT21's organizer dashboard overview page: exercises
 * the rendered page against a mocked global fetch (same technique as
 * app/aprovacoes/contas/page.test.tsx). This page makes two independent GET
 * calls (getDashboard() -> /dashboard, getSubscription() -> /subscription),
 * so every mock uses factory functions returning fresh Response objects per
 * call (a shared response body throws "body stream already read" on the
 * second .json() read).
 */
import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import DashboardPage from "./page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const EVENTS_WITH_NULL_COUNTS = [
  {
    id: 1,
    title: "Show da Banda X",
    starts_at: "2026-10-01T22:00:00Z",
    status: "published",
    view_count: null,
    favorite_count: null,
    ticket_click_count: null,
    interested_count: null,
  },
  {
    id: 2,
    title: "Festa Y",
    starts_at: "2026-10-05T20:00:00Z",
    status: "pending_review",
    view_count: null,
    favorite_count: null,
    ticket_click_count: null,
    interested_count: null,
  },
  {
    id: 3,
    title: "Evento Cancelado",
    starts_at: "2026-09-20T19:00:00Z",
    status: "cancelled",
    view_count: null,
    favorite_count: null,
    ticket_click_count: null,
    interested_count: null,
  },
];

function dashboardResponse() {
  return jsonResponse({ data: EVENTS_WITH_NULL_COUNTS });
}

function finiteQuotaSubscriptionResponse() {
  return jsonResponse({
    data: {
      plan_name: "Essencial",
      monthly_price: 4990,
      publish_quota: 5,
      publishes_used_this_period: 3,
      is_at_limit: false,
    },
  });
}

function unlimitedQuotaSubscriptionResponse() {
  return jsonResponse({
    data: {
      plan_name: "Ilimitado",
      monthly_price: 19990,
      publish_quota: null,
      publishes_used_this_period: 12,
      is_at_limit: false,
    },
  });
}

function fetchRouter(routes: {
  dashboard: () => Response;
  subscription: () => Response;
}) {
  return vi.fn().mockImplementation((input: string | URL) => {
    const url = String(input);
    if (url.includes("/subscription")) {
      return Promise.resolve(routes.subscription());
    }
    if (url.includes("/dashboard")) {
      return Promise.resolve(routes.dashboard());
    }
    return Promise.resolve(jsonResponse({ message: "Rota inesperada." }, 404));
  });
}

describe("app/dashboard/page.tsx (integration, real client + http stack)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN events with null counts WHEN the page mounts THEN stat cards render em dash placeholders instead of 0", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter({
        dashboard: dashboardResponse,
        subscription: finiteQuotaSubscriptionResponse,
      }),
    );

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Show da Banda X")).toBeInTheDocument());

    expect(screen.getAllByText("—").length).toBe(4);
    expect(screen.getByText(/Visualizações \(dados disponíveis em breve\)/)).toBeInTheDocument();
    expect(screen.getByText(/Favoritos \(dados disponíveis em breve\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Cliques em ingresso \(dados disponíveis em breve\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Interessados \(dados disponíveis em breve\)/)).toBeInTheDocument();
  });

  test("GIVEN events across statuses WHEN the page mounts THEN the donut widget buckets them correctly", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter({
        dashboard: dashboardResponse,
        subscription: finiteQuotaSubscriptionResponse,
      }),
    );

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByRole("img", { name: /Eventos por status: total 3/ })).toBeInTheDocument(),
    );

    const donut = screen.getByRole("img", { name: /Eventos por status/ });
    expect(donut).toBeInTheDocument();
    // One event each in published, pending_review (Em Revisão), cancelled —
    // scoped to the donut widget's container since the event table below
    // also renders "Publicado"/"Em Revisão"/"Cancelado" via StatusPill.
    const donutWidget = donut.closest("div.rounded-admin-default") as HTMLElement;
    expect(within(donutWidget).getByText(/^Publicado$/)).toBeInTheDocument();
    expect(within(donutWidget).getByText(/^Em Revisão$/)).toBeInTheDocument();
    expect(within(donutWidget).getByText(/^Cancelado$/)).toBeInTheDocument();
  });

  test("GIVEN a finite publish quota WHEN the page mounts THEN the progress bar shows the correct percentage and pt-BR label", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter({
        dashboard: dashboardResponse,
        subscription: finiteQuotaSubscriptionResponse,
      }),
    );

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("3 de 5 publicações usadas este mês")).toBeInTheDocument(),
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "60");
  });

  test("GIVEN an unlimited publish quota WHEN the page mounts THEN it renders the plain unlimited text line instead of a bar", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter({
        dashboard: dashboardResponse,
        subscription: unlimitedQuotaSubscriptionResponse,
      }),
    );

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("Publicações ilimitadas neste plano.")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  test("GIVEN the dashboard endpoint fails WHEN the page mounts THEN it renders a pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter({
        dashboard: () => jsonResponse({ message: "Acesso negado." }, 403),
        subscription: finiteQuotaSubscriptionResponse,
      }),
    );

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Acesso negado.")).toBeInTheDocument());
  });

  test("GIVEN the subscription endpoint fails WHEN the page mounts THEN it renders a pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter({
        dashboard: dashboardResponse,
        subscription: () => jsonResponse({ message: "Erro ao carregar assinatura." }, 500),
      }),
    );

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("Erro ao carregar assinatura.")).toBeInTheDocument(),
    );
  });
});
