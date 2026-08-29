import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EventosPage from "../page";
import { apiClient } from "@/lib/api/client";

/**
 * Mocks only the network boundary (`@/lib/api/client`) so the real
 * `useOrganizerEvents` hook and this page are exercised together.
 */
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    events: {
      list: jest.fn(),
      submit: jest.fn(),
      duplicate: jest.fn(),
      cancel: jest.fn(),
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
const mockedSubmit = apiClient.events.submit as jest.Mock;
const mockedDuplicate = apiClient.events.duplicate as jest.Mock;
const mockedCancel = apiClient.events.cancel as jest.Mock;

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

describe("EventosPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedSubmit.mockReset();
    mockedDuplicate.mockReset();
    mockedCancel.mockReset();
  });

  it("GIVEN the organizer's events WHEN the page loads THEN renders them in the table with formatted date, city, and status", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildEvent()] });

    render(<EventosPage />);

    expect(await screen.findByText("Show de Rock")).toBeInTheDocument();
    expect(screen.getByText("Vitória")).toBeInTheDocument();
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ Novo Evento" })).toHaveAttribute(
      "href",
      "/eventos/novo",
    );
  });

  it("GIVEN a draft event WHEN 'Enviar para revisão' is clicked THEN calls submit with the event id", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ status: "draft" })] });
    mockedSubmit.mockResolvedValueOnce({ data: buildEvent({ status: "pending_review" }) });

    render(<EventosPage />);
    await screen.findByText("Show de Rock");

    await user.click(screen.getByRole("button", { name: "Enviar para revisão" }));

    await waitFor(() => expect(mockedSubmit).toHaveBeenCalledWith(1));
  });

  it("GIVEN a draft event THEN does not show a 'Cancelar' action, but a published event does and it calls cancel with the id", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ id: 2, status: "published" })] });
    mockedCancel.mockResolvedValueOnce({ data: buildEvent({ id: 2, status: "cancelled" }) });

    render(<EventosPage />);
    const row = (await screen.findByText("Show de Rock")).closest("tr") as HTMLElement;

    expect(within(row).queryByRole("button", { name: "Enviar para revisão" })).not.toBeInTheDocument();
    const cancelButton = within(row).getByRole("button", { name: "Cancelar" });
    await user.click(cancelButton);

    await waitFor(() => expect(mockedCancel).toHaveBeenCalledWith(2));
  });

  it("GIVEN any event WHEN 'Duplicar' is clicked THEN calls duplicate with the event id", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ id: 3 })] });
    mockedDuplicate.mockResolvedValueOnce({ data: buildEvent({ id: 4, title: "Show de Rock (cópia)" }) });

    render(<EventosPage />);
    await screen.findByText("Show de Rock");

    await user.click(screen.getByRole("button", { name: "Duplicar" }));

    await waitFor(() => expect(mockedDuplicate).toHaveBeenCalledWith(3));
  });

  it("GIVEN an event WHEN 'Editar' is clicked THEN links to its edit route", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildEvent({ id: 7 })] });

    render(<EventosPage />);
    await screen.findByText("Show de Rock");

    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/eventos/7/editar",
    );
  });
});
