import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EventoApprovalsPage from "@/app/aprovacoes/eventos/page";
import { apiClient, ApiError } from "@/lib/api/client";
import { City, EventCreatedByType, EventStatus } from "@/lib/enums";
import type { Paginated, QorEvent } from "@/lib/api/types";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    eventApprovals: {
      list: jest.fn(),
      decide: jest.fn(),
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

const mockedList = apiClient.eventApprovals.list as jest.Mock;
const mockedDecide = apiClient.eventApprovals.decide as jest.Mock;

function makeEvent(overrides: Partial<QorEvent> = {}): QorEvent {
  return {
    id: 1,
    title: "Show na Praça",
    description: "desc",
    cover_image_url: null,
    starts_at: "2099-01-01T20:00:00Z",
    city: City.Vitoria,
    genre_id: 1,
    address: null,
    is_free: true,
    ticket_url: null,
    capacity: null,
    age_rating: null,
    notes: null,
    status: EventStatus.PendingReview,
    created_by_type: EventCreatedByType.VenueAdmin,
    created_by_id: 1,
    ...overrides,
  };
}

function paginated(events: QorEvent[]): Paginated<QorEvent> {
  return { data: events, current_page: 1, per_page: 15, total: events.length };
}

describe("EventoApprovalsPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedDecide.mockReset();
  });

  test("GIVEN the queue is loading THEN a loading message is shown", async () => {
    mockedList.mockReturnValue(new Promise(() => {}));
    render(<EventoApprovalsPage />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  test("GIVEN the API call fails THEN a pt-BR error message is shown", async () => {
    mockedList.mockRejectedValueOnce(new ApiError("Não autorizado.", 403));
    render(<EventoApprovalsPage />);
    expect(await screen.findByText("Não autorizado.")).toBeInTheDocument();
  });

  test("GIVEN a pending event WHEN approving with no feedback THEN decide is called with 'approved' and no feedback", async () => {
    const event = makeEvent();
    mockedList.mockResolvedValueOnce(paginated([event]));
    mockedList.mockResolvedValueOnce(paginated([]));
    mockedDecide.mockResolvedValueOnce({});

    const user = userEvent.setup();
    render(<EventoApprovalsPage />);

    expect(await screen.findByText("Show na Praça")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aprovar" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Aprovar" }));

    await waitFor(() =>
      expect(mockedDecide).toHaveBeenCalledWith(1, { outcome: "approved", feedback: undefined }),
    );
  });

  test("GIVEN a pending event WHEN rejecting with feedback THEN decide is called with 'rejected' and the feedback text", async () => {
    const event = makeEvent();
    mockedList.mockResolvedValueOnce(paginated([event]));
    mockedList.mockResolvedValueOnce(paginated([]));
    mockedDecide.mockResolvedValueOnce({});

    const user = userEvent.setup();
    render(<EventoApprovalsPage />);

    expect(await screen.findByText("Show na Praça")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rejeitar" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Feedback (opcional)")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Feedback (opcional)"), "Faltam informações.");
    await user.click(within(dialog).getByRole("button", { name: "Rejeitar" }));

    await waitFor(() =>
      expect(mockedDecide).toHaveBeenCalledWith(1, {
        outcome: "rejected",
        feedback: "Faltam informações.",
      }),
    );
  });

  test("GIVEN a pending event WHEN rejecting without feedback THEN decide is called with undefined feedback", async () => {
    const event = makeEvent();
    mockedList.mockResolvedValueOnce(paginated([event]));
    mockedList.mockResolvedValueOnce(paginated([]));
    mockedDecide.mockResolvedValueOnce({});

    const user = userEvent.setup();
    render(<EventoApprovalsPage />);

    expect(await screen.findByText("Show na Praça")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rejeitar" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Rejeitar" }));

    await waitFor(() =>
      expect(mockedDecide).toHaveBeenCalledWith(1, { outcome: "rejected", feedback: undefined }),
    );
  });

  test("GIVEN an event whose starts_at has already passed while still pending_review THEN the past-date flag is shown", async () => {
    const pastEvent = makeEvent({
      id: 2,
      title: "Show Atrasado",
      starts_at: "2020-01-01T20:00:00Z",
      status: EventStatus.PendingReview,
    });
    mockedList.mockResolvedValueOnce(paginated([pastEvent]));

    render(<EventoApprovalsPage />);

    expect(await screen.findByText("Show Atrasado")).toBeInTheDocument();
    expect(screen.getByText("(data já passou)")).toBeInTheDocument();
  });

  test("GIVEN a pending event whose starts_at is in the future THEN no past-date flag is shown", async () => {
    const event = makeEvent();
    mockedList.mockResolvedValueOnce(paginated([event]));

    render(<EventoApprovalsPage />);

    expect(await screen.findByText("Show na Praça")).toBeInTheDocument();
    expect(screen.queryByText("(data já passou)")).not.toBeInTheDocument();
  });
});
