import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EditarPlanoPage from "../page";
import { apiClient, ApiError } from "@/lib/api/client";

const mockPush = jest.fn();
let mockParams: { id: string } = { id: "1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

/**
 * Mocks only the network boundary (`@/lib/api/client`) so the real
 * `usePlans` hook, `PlanForm`, and this page are exercised together end
 * to end.
 */
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    plans: {
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

const mockedList = apiClient.plans.list as jest.Mock;
const mockedUpdate = apiClient.plans.update as jest.Mock;

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

describe("EditarPlanoPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedUpdate.mockReset();
    mockPush.mockReset();
    mockParams = { id: "1" };
  });

  it("GIVEN the plan list has not loaded yet THEN shows a loading state", () => {
    mockedList.mockReturnValueOnce(new Promise(() => {}));

    render(<EditarPlanoPage />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("GIVEN the route id is not in the plan list THEN shows a pt-BR not-found message", async () => {
    mockedList.mockResolvedValueOnce({ data: [buildPlan({ id: 99 })] });
    mockParams = { id: "1" };

    render(<EditarPlanoPage />);

    expect(await screen.findByText("Plano não encontrado.")).toBeInTheDocument();
  });

  it("GIVEN the matching plan loads WHEN the form is submitted THEN calls update with the id and payload and redirects to /planos", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildPlan({ id: 1 })] });
    mockedUpdate.mockResolvedValueOnce({ data: buildPlan({ id: 1, name: "Plano Atualizado" }) });

    render(<EditarPlanoPage />);

    const nameInput = await screen.findByLabelText("Nome do plano");
    expect(nameInput).toHaveValue("Plano Básico");

    await user.clear(nameInput);
    await user.type(nameInput, "Plano Atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(mockedUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Plano Atualizado" }));
    expect(mockPush).toHaveBeenCalledWith("/planos");
  });

  it("GIVEN update fails with an ApiError WHEN submitted THEN shows the pt-BR message and does not redirect", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValueOnce({ data: [buildPlan({ id: 1 })] });
    mockedUpdate.mockRejectedValueOnce(new ApiError("Você não tem permissão para executar esta ação.", 403));

    render(<EditarPlanoPage />);

    await screen.findByLabelText("Nome do plano");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Você não tem permissão para executar esta ação."),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
