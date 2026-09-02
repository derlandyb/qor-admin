/**
 * Integration test for AT30's Super Admin plan list page: exercises the
 * rendered page against a mocked global fetch, same technique as
 * app/aprovacoes/contas/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlansPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function plansPage(): Response {
  return jsonResponse({
    data: [
      {
        id: 1,
        name: "Gratuito",
        monthly_price: 0,
        annual_price: null,
        publish_quota: 5,
        is_active: true,
        is_default_free: true,
      },
    ],
  });
}

describe("app/planos/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN plans exist WHEN the page mounts THEN it renders the plan table", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(plansPage())));

    render(<PlansPage />);

    await waitFor(() => expect(screen.getByText("Gratuito")).toBeInTheDocument());
  });

  test("GIVEN Novo Plano is clicked THEN it navigates to /planos/novo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(plansPage())));

    render(<PlansPage />);
    await waitFor(() => expect(screen.getByText("Gratuito")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Novo Plano" }));

    expect(pushMock).toHaveBeenCalledWith("/planos/novo");
  });

  test("GIVEN an active plan WHEN Desativar is confirmed THEN it POSTs to /plans/{id}/deactivate", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/deactivate")) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: 1,
              name: "Gratuito",
              monthly_price: 0,
              annual_price: null,
              publish_quota: 5,
              is_active: false,
              is_default_free: true,
            },
          }),
        );
      }
      return Promise.resolve(plansPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PlansPage />);
    await waitFor(() => expect(screen.getByText("Gratuito")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Desativar" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Desativar" }));

    await waitFor(() => {
      const deactivateCall = fetchMock.mock.calls.find((call) =>
        String(call[0]).includes("/deactivate"),
      );
      expect(deactivateCall).toBeDefined();
    });
    const deactivateCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/deactivate"),
    )!;
    expect(String(deactivateCall[0])).toContain("/plans/1/deactivate");
  });

  test("GIVEN the server rejects the request WHEN the page mounts THEN it renders the pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Acesso negado." }, 403)),
    );

    render(<PlansPage />);

    await waitFor(() => expect(screen.getByText("Acesso negado.")).toBeInTheDocument());
  });
});
