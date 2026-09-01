/**
 * Integration test for AT16's account-approval queue page: exercises the
 * rendered page against a mocked global fetch (same technique as
 * app/entrar/page.test.tsx and hooks/__tests__/useApprovalQueues.integration.test.tsx).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountApprovalsPage from "./page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pendingAccountsPage(): Response {
  return jsonResponse({
    data: [
      {
        type: "venue",
        id: 1,
        name: "Casa X",
        contact_email: "casa@x.com",
        contact_phone: "27999990000",
        city: "vitoria",
      },
      {
        type: "promoter",
        id: 2,
        name: "Produtora Y",
        contact_email: "produtora@y.com",
        contact_phone: "27999991111",
        instagram: "@produtoray",
        tiktok: null,
      },
    ],
    current_page: 1,
    per_page: 10,
    total: 2,
  });
}

describe("app/aprovacoes/contas/page.tsx (integration, real hook + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN pending venue/promoter accounts WHEN the page mounts THEN it renders the queue with their details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(pendingAccountsPage())),
    );

    render(<AccountApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Casa X")).toBeInTheDocument());
    expect(screen.getByText("Produtora Y")).toBeInTheDocument();
    expect(screen.getByText("casa@x.com")).toBeInTheDocument();
    expect(screen.getByText("produtora@y.com")).toBeInTheDocument();
    expect(screen.getAllByText(/aprovar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/rejeitar/i).length).toBeGreaterThan(0);
  });

  test("GIVEN a pending account WHEN Aprovar is confirmed without a reason THEN decide() sends outcome approved and reason null", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/decide")) {
        return Promise.resolve(jsonResponse({ data: { id: 1 } }));
      }
      return Promise.resolve(pendingAccountsPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AccountApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Casa X")).toBeInTheDocument());

    const approveButtons = screen.getAllByText(/aprovar/i);
    await userEvent.click(approveButtons[0]!);

    const confirmButton = await screen.findByRole("button", { name: /confirmar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"));
      expect(decideCall).toBeDefined();
    });

    const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"))!;
    const [decideUrl, decideInit] = decideCall;
    expect(String(decideUrl)).toContain("/approvals/accounts/venue/1/decide");
    const body = JSON.parse(decideInit.body as string);
    expect(body).toEqual({ outcome: "approved", reason: null });
  });

  test("GIVEN a pending account WHEN Rejeitar is confirmed with a typed reason THEN decide() sends outcome rejected and the reason", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/decide")) {
        return Promise.resolve(jsonResponse({ data: { id: 2 } }));
      }
      return Promise.resolve(pendingAccountsPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AccountApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Produtora Y")).toBeInTheDocument());

    const rejectButtons = screen.getAllByText(/rejeitar/i);
    await userEvent.click(rejectButtons[1]!);

    const reasonField = await screen.findByLabelText(/motivo/i);
    await userEvent.type(reasonField, "Documentação incompleta.");

    const confirmButton = screen.getByRole("button", { name: /confirmar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"));
      expect(decideCall).toBeDefined();
    });

    const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"))!;
    const [decideUrl, decideInit] = decideCall;
    expect(String(decideUrl)).toContain("/approvals/accounts/promoter/2/decide");
    const body = JSON.parse(decideInit.body as string);
    expect(body).toEqual({ outcome: "rejected", reason: "Documentação incompleta." });
  });

  test("GIVEN a pending account WHEN Rejeitar is confirmed without typing a reason THEN decide() still succeeds with reason null", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/decide")) {
        return Promise.resolve(jsonResponse({ data: { id: 1 } }));
      }
      return Promise.resolve(pendingAccountsPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AccountApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Casa X")).toBeInTheDocument());

    const rejectButtons = screen.getAllByText(/rejeitar/i);
    await userEvent.click(rejectButtons[0]!);

    const confirmButton = await screen.findByRole("button", { name: /confirmar/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"));
      expect(decideCall).toBeDefined();
    });

    const decideCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/decide"))!;
    const body = JSON.parse(decideCall[1].body as string);
    expect(body).toEqual({ outcome: "rejected", reason: null });
  });

  test("GIVEN the server rejects the request WHEN the page mounts THEN it renders the pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Acesso negado." }, 403)),
    );

    render(<AccountApprovalsPage />);

    await waitFor(() => expect(screen.getByText("Acesso negado.")).toBeInTheDocument());
  });
});
