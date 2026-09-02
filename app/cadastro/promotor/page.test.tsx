/**
 * Integration test for AT19's promoter self-registration page: exercises the
 * rendered page against a mocked global fetch (same technique as
 * app/cadastro/local/page.test.tsx).
 *
 * Gotchas carried over from that file: (1) http.ts's CSRF-bootstrap flag is
 * module-level and only fires its GET once per test file, so mutating
 * requests are routed by URL/method rather than a fixed mockResolvedValueOnce
 * queue; (2) any fixture read via `.json()` across multiple fetch calls must
 * be a factory returning a fresh Response each time; (3) use anchored regexes
 * for getByLabelText/getByRole(..., { name }) queries since ConsentCapture's
 * consent copy contains substrings ("cidade" inside "privacidade", "aceito os
 * termos de uso") that can accidentally match multiple elements.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PromoterSelfRegistrationPage from "./page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^nome$/i), "DJ Promo");
  await user.type(screen.getByLabelText(/telefone de contato/i), "27999990000");
  await user.type(screen.getByLabelText(/e-mail de contato/i), "contato@djpromo.com");
  await user.type(screen.getByLabelText(/instagram/i), "@djpromo");
  await user.type(screen.getByLabelText(/tiktok/i), "@djpromo");
  await user.type(screen.getByLabelText(/e-mail de cadastro/i), "cadastro@djpromo.com");
  await user.type(screen.getByLabelText(/senha/i), "senha123");
  await user.click(screen.getByRole("checkbox", { name: /^aceito os termos de uso$/i }));
}

describe("app/cadastro/promotor/page.tsx (integration, real hook + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a visitor WHEN /cadastro/promotor mounts THEN it renders the consent step, and the form appears once consent is given", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "ok" })));
    const user = userEvent.setup();

    render(<PromoterSelfRegistrationPage />);

    expect(screen.getByText(/li e aceito os/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^nome$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /li e aceito os/i }));

    expect(await screen.findByLabelText(/^nome$/i)).toBeInTheDocument();
  });

  test("GIVEN a fully filled promoter form WHEN submitted THEN it POSTs to /promoters/register and shows the pending-approval confirmation", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/promoters/register")) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: 1,
              name: "DJ Promo",
              contact_phone: "27999990000",
              contact_email: "contato@djpromo.com",
              instagram: "@djpromo",
              tiktok: "@djpromo",
              approval_status: "pending",
              image_url: null,
            },
          }),
        );
      }
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<PromoterSelfRegistrationPage />);

    await user.click(screen.getByRole("checkbox", { name: /li e aceito os/i }));
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() =>
      expect(screen.getByText(/cadastro enviado! sua conta está em análise\./i)).toBeInTheDocument(),
    );

    const registerCall = fetchMock.mock.calls.find((call: unknown[]) =>
      String(call[0]).includes("/promoters/register"),
    );
    expect(registerCall).toBeDefined();
    const requestInit = registerCall![1] as RequestInit;
    expect(requestInit.method).toBe("POST");
    const body = JSON.parse(requestInit.body as string);
    expect(body).toMatchObject({
      name: "DJ Promo",
      contact_phone: "27999990000",
      contact_email: "contato@djpromo.com",
      instagram: "@djpromo",
      tiktok: "@djpromo",
      registration_email: "cadastro@djpromo.com",
      password: "senha123",
      terms_accepted: true,
    });
  });

  test("GIVEN a 422 duplicate-email response WHEN submitted THEN the pt-BR error banner renders", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/promoters/register")) {
        return Promise.resolve(
          jsonResponse(
            {
              message: "O e-mail de cadastro já está em uso.",
              errors: { registration_email: ["O e-mail de cadastro já está em uso."] },
            },
            422,
          ),
        );
      }
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<PromoterSelfRegistrationPage />);

    await user.click(screen.getByRole("checkbox", { name: /li e aceito os/i }));
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() =>
      expect(screen.getByText(/o e-mail de cadastro já está em uso\./i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/cadastro enviado! sua conta está em análise\./i),
    ).not.toBeInTheDocument();
  });
});
