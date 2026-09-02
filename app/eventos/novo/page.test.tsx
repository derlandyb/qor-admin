/**
 * Integration test for AT20's organizer event create page. This is the
 * actual payoff of the earlier qor-api /me + /venues/me + /promoters/me
 * detour: the key assertions here are that a venue_admin session pre-fills
 * EventForm's address/city fields from that venue's own record, while a
 * promoter session leaves the address field empty (manual per-event
 * location) — checked via the rendered "Endereço" input's value, not just
 * that the page renders.
 *
 * Same gotchas as app/eventos/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewEventPage from "./page";

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

function meResponse(accountType: "venue_admin" | "promoter"): Response {
  return jsonResponse({
    data: { id: 1, name: "Organizador", email: "org@example.com", permissions: [], account_type: accountType },
  });
}

function venueResponse(approvalStatus = "approved"): Response {
  return jsonResponse({
    data: {
      id: 10,
      name: "Casa X",
      description: "Descrição",
      address: "Rua A, 123",
      city: "vila_velha",
      contact_phone: "27999990000",
      contact_email: "contato@casax.com",
      approval_status: approvalStatus,
      image_url: null,
    },
  });
}

function promoterResponse(approvalStatus = "approved"): Response {
  return jsonResponse({
    data: {
      id: 20,
      name: "Promoter X",
      contact_phone: "27999990000",
      contact_email: "promoter@example.com",
      instagram: null,
      tiktok: null,
      approval_status: approvalStatus,
    },
  });
}

function subscriptionResponse(isAtLimit: boolean): Response {
  return jsonResponse({
    data: {
      plan_name: "Gratuito",
      monthly_price: 0,
      publish_quota: 5,
      publishes_used_this_period: isAtLimit ? 5 : 2,
      is_at_limit: isAtLimit,
    },
  });
}

function stubFetch(opts: {
  accountType: "venue_admin" | "promoter";
  approvalStatus?: string;
  isAtLimit?: boolean;
  extra?: (url: string, init?: RequestInit) => Response | undefined;
}) {
  const fetchMock = vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/sanctum/csrf-cookie")) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const extra = opts.extra?.(url, init);
    if (extra) return Promise.resolve(extra);
    if (url.endsWith("/me") && !url.includes("venues") && !url.includes("promoters")) {
      return Promise.resolve(meResponse(opts.accountType));
    }
    if (url.includes("/venues/me")) {
      return Promise.resolve(venueResponse(opts.approvalStatus ?? "approved"));
    }
    if (url.includes("/promoters/me")) {
      return Promise.resolve(promoterResponse(opts.approvalStatus ?? "approved"));
    }
    if (url.includes("/subscription")) {
      return Promise.resolve(subscriptionResponse(opts.isAtLimit ?? false));
    }
    return Promise.resolve(jsonResponse({ message: "not found" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("app/eventos/novo/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a venue_admin whose account is still pending approval WHEN /eventos/novo mounts THEN it shows the blocked notice instead of the form", async () => {
    stubFetch({ accountType: "venue_admin", approvalStatus: "pending_approval" });

    render(<NewEventPage />);

    await waitFor(() =>
      expect(screen.getByText(/sua conta ainda está em análise/i)).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText(/^título$/i)).not.toBeInTheDocument();
  });

  test("GIVEN an approved venue_admin session WHEN /eventos/novo mounts THEN the address field defaults to the venue's own address", async () => {
    stubFetch({ accountType: "venue_admin" });

    render(<NewEventPage />);

    const addressInput = await screen.findByLabelText(/^endereço/i);
    expect(addressInput).toHaveValue("Rua A, 123");
    expect(screen.getByLabelText(/^cidade$/i)).toHaveValue("vila_velha");
  });

  test("GIVEN an approved promoter session WHEN /eventos/novo mounts THEN the address field has no default (manual per-event location)", async () => {
    stubFetch({ accountType: "promoter" });

    render(<NewEventPage />);

    const addressInput = await screen.findByLabelText(/^endereço/i);
    expect(addressInput).toHaveValue("");
  });

  test("GIVEN a filled create form WHEN submitted THEN it POSTs to /events and redirects to /eventos", async () => {
    const fetchMock = stubFetch({
      accountType: "promoter",
      extra: (url) => {
        if (url.endsWith("/events") || url.includes("/api/admin/v1/events")) {
          return jsonResponse({ data: { id: 99 } });
        }
        return undefined;
      },
    });

    render(<NewEventPage />);

    await screen.findByLabelText(/^título$/i);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^título$/i), "Show Novo");
    await user.type(screen.getByLabelText(/descrição/i), "Descrição do show novo.");
    await user.type(screen.getByLabelText(/data e hora/i), "2099-12-31T22:00");
    await user.selectOptions(screen.getByLabelText(/^cidade$/i), "vitoria");
    await user.type(screen.getByLabelText(/gênero/i), "1");
    await user.click(screen.getByLabelText(/evento gratuito/i));

    await user.click(screen.getByRole("button", { name: /criar evento/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/eventos"));
    const createCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes("/events") && (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(createCall).toBeDefined();
  });

  test("GIVEN an organizer already at their publish-quota limit WHEN /eventos/novo mounts THEN it shows the at-limit banner instead of the form", async () => {
    stubFetch({ accountType: "promoter", isAtLimit: true });

    render(<NewEventPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText(/^título$/i)).not.toBeInTheDocument();
  });

  test("GIVEN quota is exceeded between page load and submit WHEN create rejects with quota_exceeded THEN it shows the at-limit banner instead of a generic error", async () => {
    stubFetch({
      accountType: "promoter",
      extra: (url) => {
        if (url.endsWith("/events") || url.includes("/api/admin/v1/events")) {
          return jsonResponse(
            { message: "Você atingiu o limite de publicações do seu plano", code: "quota_exceeded" },
            422,
          );
        }
        return undefined;
      },
    });

    render(<NewEventPage />);

    await screen.findByLabelText(/^título$/i);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^título$/i), "Show Novo");
    await user.type(screen.getByLabelText(/descrição/i), "Descrição do show novo.");
    await user.type(screen.getByLabelText(/data e hora/i), "2099-12-31T22:00");
    await user.selectOptions(screen.getByLabelText(/^cidade$/i), "vitoria");
    await user.type(screen.getByLabelText(/gênero/i), "1");
    await user.click(screen.getByLabelText(/evento gratuito/i));
    await user.click(screen.getByRole("button", { name: /criar evento/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Você atingiu o limite de publicações do seu plano/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Erro ao criar o evento.")).not.toBeInTheDocument();
  });
});
