/**
 * Integration test for AT30's Super Admin create-plan page, same technique
 * as app/eventos/novo/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewPlanPage from "./page";

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

describe("app/planos/novo/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a filled create form WHEN submitted THEN it POSTs to /plans and redirects to /planos", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.endsWith("/plans")) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: 2,
              name: "Pro",
              monthly_price: 29.9,
              annual_price: null,
              publish_quota: 20,
              is_active: true,
              is_default_free: false,
            },
          }),
        );
      }
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewPlanPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Pro");
    await user.clear(screen.getByLabelText("Preço mensal"));
    await user.type(screen.getByLabelText("Preço mensal"), "29.9");
    await user.clear(screen.getByLabelText("Cota de publicações mensais"));
    await user.type(screen.getByLabelText("Cota de publicações mensais"), "20");
    await user.click(screen.getByRole("button", { name: "Criar Plano" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/planos"));
    const createCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).endsWith("/plans") && (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(createCall).toBeDefined();
  });
});
