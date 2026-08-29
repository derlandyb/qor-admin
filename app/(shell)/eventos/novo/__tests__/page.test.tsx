import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NovoEventoPage from "../page";
import { apiClient, ApiError } from "@/lib/api/client";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
      create: jest.fn(),
    },
    subscription: {
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

const mockedList = apiClient.events.list as jest.Mock;
const mockedCreate = apiClient.events.create as jest.Mock;
const mockedSubscriptionGet = apiClient.subscription.get as jest.Mock;

function buildUsage(overrides: Record<string, unknown> = {}) {
  return {
    plan_name: "Básico",
    monthly_price: 0,
    publish_quota: 5,
    publishes_used_this_period: 5,
    is_at_limit: true,
    ...overrides,
  };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Título"), "Show da Banda");
  await user.type(screen.getByLabelText("Descrição"), "Um show incrível");
  await user.type(screen.getByLabelText("Data de início"), "2026-09-01T20:00");
  await user.selectOptions(screen.getByLabelText("Cidade"), "vitoria");
  await user.type(screen.getByLabelText("Gênero (ID)"), "3");
  await user.type(screen.getByLabelText("Link de ingresso"), "https://ingresso.com/show");
  await user.click(screen.getByRole("button", { name: "Criar evento" }));
}

describe("NovoEventoPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedCreate.mockReset();
    mockedSubscriptionGet.mockReset();
    mockPush.mockReset();
    mockedList.mockResolvedValue({ data: [] });
    mockedSubscriptionGet.mockResolvedValue({ data: buildUsage({ is_at_limit: false }) });
  });

  it("GIVEN a valid event form WHEN submitted THEN calls create and redirects to /eventos", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValueOnce({
      data: { id: 1, title: "Show da Banda", status: "draft" },
    });

    render(<NovoEventoPage />);

    await fillAndSubmit(user);

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/eventos");
  });

  it("GIVEN the organizer's account is not yet approved WHEN create fails with a policy ApiError THEN shows the pt-BR message instead of a generic fallback and does not redirect", async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValueOnce(new ApiError("Sua conta ainda não foi aprovada.", 403));

    render(<NovoEventoPage />);

    await fillAndSubmit(user);

    expect(await screen.findByText("Sua conta ainda não foi aprovada.")).toBeInTheDocument();
    expect(screen.queryByText("Ocorreu um erro inesperado.")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("GIVEN the organizer's quota is at limit THEN shows the blocking banner with the upgrade link and quota widget", async () => {
    mockedSubscriptionGet.mockResolvedValue({ data: buildUsage({ is_at_limit: true }) });

    render(<NovoEventoPage />);

    expect(await screen.findByText(/limite de publicações do seu plano/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver planos disponíveis" })).toHaveAttribute(
      "href",
      "https://qor.app/planos",
    );
    expect(screen.getByText(/de 5 publicações usadas este mês/)).toBeInTheDocument();
  });

  it("GIVEN the organizer's quota is not at limit THEN does not show the banner", async () => {
    mockedSubscriptionGet.mockResolvedValue({ data: buildUsage({ is_at_limit: false }) });

    render(<NovoEventoPage />);

    await screen.findByLabelText("Título");
    expect(screen.queryByText(/limite de publicações do seu plano/i)).not.toBeInTheDocument();
  });
});
