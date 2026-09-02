/**
 * Integration test for AT32's organizer plan/usage view, same technique as
 * app/planos/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SubscriptionPage from "./page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("app/assinatura/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN an organizer's subscription WHEN the page mounts THEN it shows plan name/price and the quota usage widget", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: {
            plan_name: "Gratuito",
            monthly_price: 0,
            publish_quota: 5,
            publishes_used_this_period: 2,
            is_at_limit: false,
          },
        }),
      ),
    );

    render(<SubscriptionPage />);

    await waitFor(() => expect(screen.getByText("Gratuito")).toBeInTheDocument());
    expect(screen.getByText("2 de 5 publicações usadas este mês")).toBeInTheDocument();
  });

  test("GIVEN an organizer at their quota limit WHEN the page mounts THEN it shows the at-limit banner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: {
            plan_name: "Gratuito",
            monthly_price: 0,
            publish_quota: 5,
            publishes_used_this_period: 5,
            is_at_limit: true,
          },
        }),
      ),
    );

    render(<SubscriptionPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
  });

  test("GIVEN the server rejects the request WHEN the page mounts THEN it renders the pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Acesso negado." }, 403)),
    );

    render(<SubscriptionPage />);

    await waitFor(() => expect(screen.getByText("Acesso negado.")).toBeInTheDocument());
  });
});
