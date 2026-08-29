import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PlanosPage from "../page";
import { apiClient } from "@/lib/api/client";

/**
 * Mocks only the network boundary (`@/lib/api/client`) so the real
 * `usePlans` hook and this page are exercised together.
 */
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    plans: {
      list: jest.fn(),
      deactivate: jest.fn(),
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

const mockedList = apiClient.plans.list as jest.Mock;
const mockedDeactivate = apiClient.plans.deactivate as jest.Mock;

function buildPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Plano Básico",
    monthly_price: 49.9,
    annual_price: 499,
    publish_quota: 10,
    is_active: true,
    is_default_free: false,
    ...overrides,
  };
}

describe("PlanosPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedDeactivate.mockReset();
  });

  it("GIVEN the plan list WHEN the page loads THEN renders them in the table and links to /planos/novo", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildPlan()] });

    render(<PlanosPage />);

    expect(await screen.findByText("Plano Básico")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ Novo Plano" })).toHaveAttribute(
      "href",
      "/planos/novo",
    );
  });

  it("GIVEN an active plan WHEN 'Editar' is clicked THEN links to its edit route", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildPlan({ id: 7 })] });

    render(<PlanosPage />);
    await screen.findByText("Plano Básico");

    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/planos/7/editar",
    );
  });

  it("GIVEN an inactive plan THEN does not show a 'Desativar' action", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildPlan({ is_active: false })] });

    render(<PlanosPage />);
    await screen.findByText("Plano Básico");

    expect(screen.queryByRole("button", { name: "Desativar" })).not.toBeInTheDocument();
  });

  it("GIVEN an active plan WHEN 'Desativar' is clicked and confirmed THEN calls deactivate with the plan id", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildPlan()] });
    mockedDeactivate.mockResolvedValueOnce({ data: buildPlan({ is_active: false }) });

    render(<PlanosPage />);
    await screen.findByText("Plano Básico");

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText(/motivo/i)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Desativar" }));

    await waitFor(() => expect(mockedDeactivate).toHaveBeenCalledWith(1));
  });

  it("GIVEN the confirm modal is open WHEN 'Cancelar' is clicked THEN closes without calling deactivate", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildPlan()] });

    render(<PlanosPage />);
    await screen.findByText("Plano Básico");

    await user.click(screen.getByRole("button", { name: "Desativar" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockedDeactivate).not.toHaveBeenCalled();
  });
});
