import { render, screen } from "@testing-library/react";

import AssinaturaPage from "../page";
import { apiClient, ApiError } from "@/lib/api/client";
import type { UsageSummary } from "@/lib/api/types";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
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

const mockedGet = apiClient.subscription.get as jest.Mock;

function makeUsage(overrides: Partial<UsageSummary> = {}): UsageSummary {
  return {
    plan_name: "Plano Pro",
    monthly_price: 99.9,
    publish_quota: 10,
    publishes_used_this_period: 3,
    is_at_limit: false,
    ...overrides,
  };
}

describe("AssinaturaPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  test("GIVEN the subscription is loading THEN a loading message is shown", async () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    render(<AssinaturaPage />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  test("GIVEN the API call fails THEN a pt-BR error message is shown", async () => {
    mockedGet.mockRejectedValueOnce(new ApiError("Não autorizado.", 403));
    render(<AssinaturaPage />);
    expect(await screen.findByText("Não autorizado.")).toBeInTheDocument();
  });

  test("GIVEN a usage summary THEN plan name, formatted price, and QuotaUsageWidget are rendered", async () => {
    mockedGet.mockResolvedValueOnce({ data: makeUsage() });

    render(<AssinaturaPage />);

    expect(await screen.findByText("Plano: Plano Pro")).toBeInTheDocument();
    expect(screen.getByText("Valor mensal: R$ 99,90")).toBeInTheDocument();
    expect(screen.getByText("3 de 10 publicações usadas este mês")).toBeInTheDocument();
  });
});
