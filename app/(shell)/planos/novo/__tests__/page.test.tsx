import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NovoPlanoPage from "../page";
import { apiClient, ApiError } from "@/lib/api/client";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
      create: jest.fn(),
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
const mockedCreate = apiClient.plans.create as jest.Mock;

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome do plano"), "Plano Pro");
  await user.type(screen.getByLabelText("Preço mensal"), "99.90");
  await user.type(screen.getByLabelText("Cota de publicações"), "20");
  await user.click(screen.getByRole("button", { name: "Criar plano" }));
}

describe("NovoPlanoPage", () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedCreate.mockReset();
    mockPush.mockReset();
    mockedList.mockResolvedValue({ data: [] });
  });

  it("GIVEN a valid plan form WHEN submitted THEN calls create and redirects to /planos", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValueOnce({
      data: { id: 1, name: "Plano Pro", monthly_price: 99.9, annual_price: null, publish_quota: 20, is_active: true, is_default_free: false },
    });

    render(<NovoPlanoPage />);

    await fillAndSubmit(user);

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/planos");
  });

  it("GIVEN create fails with an ApiError WHEN submitted THEN shows the pt-BR message and does not redirect", async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValueOnce(new ApiError("Você não tem permissão para executar esta ação.", 403));

    render(<NovoPlanoPage />);

    await fillAndSubmit(user);

    expect(
      await screen.findByText("Você não tem permissão para executar esta ação."),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
