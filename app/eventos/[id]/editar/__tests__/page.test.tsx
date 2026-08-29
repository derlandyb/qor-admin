import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EditarEventoPage from "@/app/eventos/[id]/editar/page";
import { apiClient, ApiError } from "@/lib/api/client";

const mockPush = jest.fn();
let mockParams: { id: string } = { id: "1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

/**
 * Mocks only the network boundary (`@/lib/api/client`) so the real
 * `useOrganizerEvents` hook, `EventForm`, and this page are exercised
 * together end to end.
 */
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    events: {
      list: jest.fn(),
      update: jest.fn(),
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

const mockedList = apiClient.events.list as jest.Mock;
const mockedUpdate = apiClient.events.update as jest.Mock;

function buildEvent(overrides: Record<string, unknown> = {}) {
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
    ticket_url: "https://ingresso.com",
    capacity: null,
    age_rating: null,
    notes: null,
    status: "draft",
    created_by_type: "venue_admin",
    created_by_id: 1,
    ...overrides,
  };
}

describe("EditarEventoPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedUpdate.mockReset();
    mockPush.mockReset();
    mockParams = { id: "1" };
  });

  it("GIVEN the events list has not loaded yet THEN shows a loading state", () => {
    mockedList.mockReturnValueOnce(new Promise(() => {}));

    render(<EditarEventoPage />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("GIVEN the route id is not in the organizer's events THEN shows a pt-BR not-found message", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ id: 99 })] });
    mockParams = { id: "1" };

    render(<EditarEventoPage />);

    expect(await screen.findByText("Evento não encontrado.")).toBeInTheDocument();
  });

  it("GIVEN the matching event loads WHEN the form is submitted THEN calls update with the id and payload and redirects to /eventos", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ id: 1 })] });
    mockedUpdate.mockResolvedValueOnce({ data: buildEvent({ id: 1, title: "Show Atualizado" }) });

    render(<EditarEventoPage />);

    const titleInput = await screen.findByLabelText("Título");
    expect(titleInput).toHaveValue("Show de Rock");

    await user.clear(titleInput);
    await user.type(titleInput, "Show Atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(mockedUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ title: "Show Atualizado" }));
    expect(mockPush).toHaveBeenCalledWith("/eventos");
  });

  it("GIVEN the organizer's account is not yet approved WHEN update fails with a policy ApiError THEN shows the pt-BR message instead of a generic fallback", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ id: 1 })] });
    mockedUpdate.mockRejectedValueOnce(new ApiError("Sua conta ainda não foi aprovada.", 403));

    render(<EditarEventoPage />);

    await screen.findByLabelText("Título");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Sua conta ainda não foi aprovada.")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
