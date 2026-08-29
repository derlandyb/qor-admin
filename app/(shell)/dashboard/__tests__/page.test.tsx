import { render, screen } from "@testing-library/react";

import DashboardPage from "../page";
import { apiClient, ApiError } from "@/lib/api/client";
import { EventStatus } from "@/lib/enums";
import type { DashboardEvent } from "@/lib/api/types";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    dashboard: {
      get: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;
    constructor(message: string, status: number, errors?: Record<string, string[]>) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.errors = errors;
    }
  },
}));

const mockedGet = apiClient.dashboard.get as jest.Mock;

function makeEvent(overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return {
    id: 1,
    title: "Show na Praça",
    starts_at: "2099-01-01T20:00:00Z",
    status: EventStatus.Published,
    view_count: null,
    favorite_count: null,
    ticket_click_count: null,
    interested_count: null,
    ...overrides,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  test("GIVEN the dashboard is loading THEN a loading message is shown", async () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  test("GIVEN the API call fails THEN a pt-BR error message is shown", async () => {
    mockedGet.mockRejectedValueOnce(new ApiError("Não autorizado.", 403));
    render(<DashboardPage />);
    expect(await screen.findByText("Não autorizado.")).toBeInTheDocument();
  });

  test("GIVEN a mixed list of events THEN stat cards and donut segments are computed from the list", async () => {
    const events = [
      makeEvent({ id: 1, title: "Publicado 1", status: EventStatus.Published }),
      makeEvent({ id: 2, title: "Publicado 2", status: EventStatus.Published }),
      makeEvent({ id: 3, title: "Pendente 1", status: EventStatus.PendingReview }),
      makeEvent({ id: 4, title: "Rascunho 1", status: EventStatus.Draft }),
    ];
    mockedGet.mockResolvedValueOnce({ data: events });

    render(<DashboardPage />);

    expect(await screen.findByText("Publicado 1")).toBeInTheDocument();

    // Stat cards: total, published, pending
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getByText("Total de eventos")).toBeInTheDocument();
    expect(screen.getByText("Eventos publicados")).toBeInTheDocument();
    expect(screen.getByText("Eventos em análise")).toBeInTheDocument();

    // Donut segment values (published=2, pending=1, draft=1, cancelled=0, ended=0)
    const segmentValues = screen.getAllByText("2");
    expect(segmentValues.length).toBeGreaterThan(0);
  });

  test("GIVEN events with null per-event counts THEN the table renders '—' not '0'", async () => {
    const events = [makeEvent()];
    mockedGet.mockResolvedValueOnce({ data: events });

    render(<DashboardPage />);

    expect(await screen.findByText("Show na Praça")).toBeInTheDocument();

    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(4);
  });
});
