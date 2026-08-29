import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PendingAccount, Paginated } from "@/lib/api/types";
import { ApprovalDecidableType, ApprovalOutcome } from "@/lib/enums";
import { ApiError } from "@/lib/api/client";
import AprovacaoDeContasPage from "../page";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    accountApprovals: {
      list: jest.fn(),
      decide: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly errors?: Record<string, string[]>,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

const { apiClient } = jest.requireMock("@/lib/api/client");

const mockList = apiClient.accountApprovals.list as jest.Mock;
const mockDecide = apiClient.accountApprovals.decide as jest.Mock;

const venue: PendingAccount = {
  id: 1,
  type: ApprovalDecidableType.Venue,
  name: "Casa Show",
  contact_email: "casa@show.com",
  contact_phone: "27999999999",
  city: "vitoria" as PendingAccount["city"],
};

const promoter: PendingAccount = {
  id: 2,
  type: ApprovalDecidableType.Promoter,
  name: "DJ Promotor",
  contact_email: "dj@promotor.com",
  contact_phone: "27988888888",
  instagram: "@djpromotor",
};

function pageOf(data: PendingAccount[]): Paginated<PendingAccount> {
  return { data, current_page: 1, per_page: 15, total: data.length };
}

describe("AprovacaoDeContasPage", () => {
  beforeEach(() => {
    mockList.mockReset();
    mockDecide.mockReset();
  });

  test("GIVEN the queue is loading WHEN the page mounts THEN a pt-BR loading state is shown", async () => {
    mockList.mockReturnValue(new Promise(() => {}));

    render(<AprovacaoDeContasPage />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  test("GIVEN the queue fails to load WHEN the page mounts THEN a pt-BR error alert is shown", async () => {
    mockList.mockRejectedValueOnce(new ApiError("Não autorizado.", 403));

    render(<AprovacaoDeContasPage />);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Não autorizado."));
  });

  test("GIVEN pending accounts WHEN the page mounts THEN each row renders type/name/contact/details", async () => {
    mockList.mockResolvedValueOnce(pageOf([venue, promoter]));

    render(<AprovacaoDeContasPage />);

    await waitFor(() => expect(screen.getByText("Casa Show")).toBeInTheDocument());

    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("casa@show.com")).toBeInTheDocument();
    expect(screen.getByText("Vitória")).toBeInTheDocument();

    expect(screen.getByText("Promotor")).toBeInTheDocument();
    expect(screen.getByText("dj@promotor.com")).toBeInTheDocument();
    expect(screen.getByText("Instagram: @djpromotor")).toBeInTheDocument();
  });

  test("GIVEN a pending account WHEN the admin approves it THEN decide is called with the approved outcome and the row is removed", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValueOnce(pageOf([venue]));
    mockDecide.mockResolvedValueOnce({
      data: {
        id: 1,
        decidable_type: ApprovalDecidableType.Venue,
        decidable_id: 1,
        outcome: ApprovalOutcome.Approved,
        reason: null,
        decided_by: 9,
        decided_at: "2026-08-29T00:00:00Z",
      },
    });
    mockList.mockResolvedValueOnce(pageOf([]));

    render(<AprovacaoDeContasPage />);

    await waitFor(() => expect(screen.getByText("Casa Show")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Aprovar" }));

    await waitFor(() =>
      expect(mockDecide).toHaveBeenCalledWith("venue", 1, {
        outcome: ApprovalOutcome.Approved,
        reason: undefined,
      }),
    );

    await waitFor(() => expect(screen.queryByText("Casa Show")).not.toBeInTheDocument());
  });

  test("GIVEN a pending account WHEN the admin rejects it with a reason THEN decide is called with the reason", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValueOnce(pageOf([venue]));
    mockDecide.mockResolvedValueOnce({
      data: {
        id: 1,
        decidable_type: ApprovalDecidableType.Venue,
        decidable_id: 1,
        outcome: ApprovalOutcome.Rejected,
        reason: "Documentação incompleta.",
        decided_by: 9,
        decided_at: "2026-08-29T00:00:00Z",
      },
    });
    mockList.mockResolvedValueOnce(pageOf([]));

    render(<AprovacaoDeContasPage />);

    await waitFor(() => expect(screen.getByText("Casa Show")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Rejeitar" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Motivo (opcional)"), "Documentação incompleta.");
    await user.click(within(dialog).getByRole("button", { name: "Rejeitar" }));

    await waitFor(() =>
      expect(mockDecide).toHaveBeenCalledWith("venue", 1, {
        outcome: ApprovalOutcome.Rejected,
        reason: "Documentação incompleta.",
      }),
    );

    await waitFor(() => expect(screen.queryByText("Casa Show")).not.toBeInTheDocument());
  });

  test("GIVEN a pending account WHEN the admin rejects it without a reason THEN decide is called with an undefined reason", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValueOnce(pageOf([venue]));
    mockDecide.mockResolvedValueOnce({
      data: {
        id: 1,
        decidable_type: ApprovalDecidableType.Venue,
        decidable_id: 1,
        outcome: ApprovalOutcome.Rejected,
        reason: null,
        decided_by: 9,
        decided_at: "2026-08-29T00:00:00Z",
      },
    });
    mockList.mockResolvedValueOnce(pageOf([]));

    render(<AprovacaoDeContasPage />);

    await waitFor(() => expect(screen.getByText("Casa Show")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Rejeitar" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Rejeitar" }));

    await waitFor(() =>
      expect(mockDecide).toHaveBeenCalledWith("venue", 1, {
        outcome: ApprovalOutcome.Rejected,
        reason: undefined,
      }),
    );

    await waitFor(() => expect(screen.queryByText("Casa Show")).not.toBeInTheDocument());
  });
});
