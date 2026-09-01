/**
 * Integration test for AT18's venue self-registration page: exercises the
 * rendered page against a mocked global fetch (same technique as
 * app/entrar/page.test.tsx and app/aprovacoes/contas/page.test.tsx).
 *
 * Gotchas carried over from those files: (1) http.ts's CSRF-bootstrap flag is
 * module-level and only fires its GET once per test file, so mutating
 * requests are routed by URL/method rather than a fixed mockResolvedValueOnce
 * queue; (2) any fixture read via `.json()` across multiple fetch calls must
 * be a factory returning a fresh Response each time.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VenueSelfRegistrationPage from "./page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^nome$/i), "Casa X");
  await user.type(screen.getByLabelText(/descrição/i), "Casa de shows no centro.");
  await user.type(screen.getByLabelText(/endereço/i), "Rua A, 123");
  await user.selectOptions(screen.getByLabelText(/^cidade$/i), "vitoria");
  await user.type(screen.getByLabelText(/telefone de contato/i), "27999990000");
  await user.type(screen.getByLabelText(/e-mail de contato/i), "contato@casax.com");
  await user.type(screen.getByLabelText(/e-mail de cadastro/i), "cadastro@casax.com");
  await user.type(screen.getByLabelText(/senha/i), "senha123");
  await user.click(screen.getByRole("checkbox", { name: /^aceito os termos de uso$/i }));
}

describe("app/cadastro/local/page.tsx (integration, real hook + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a visitor WHEN /cadastro/local mounts THEN it renders the consent step, and the form appears once consent is given", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "ok" })));
    const user = userEvent.setup();

    render(<VenueSelfRegistrationPage />);

    expect(screen.getByText(/li e aceito os/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^nome$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /li e aceito os/i }));

    expect(await screen.findByLabelText(/^nome$/i)).toBeInTheDocument();
  });

  test("GIVEN a fully filled venue form WHEN submitted THEN it POSTs to /venues/register and shows the pending-approval confirmation", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/venues/register")) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: 1,
              name: "Casa X",
              description: "Casa de shows no centro.",
              address: "Rua A, 123",
              city: "vitoria",
              contact_phone: "27999990000",
              contact_email: "contato@casax.com",
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

    render(<VenueSelfRegistrationPage />);

    await user.click(screen.getByRole("checkbox", { name: /li e aceito os/i }));
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() =>
      expect(screen.getByText(/cadastro enviado! sua conta está em análise\./i)).toBeInTheDocument(),
    );

    const registerCall = fetchMock.mock.calls.find((call: unknown[]) =>
      String(call[0]).includes("/venues/register"),
    );
    expect(registerCall).toBeDefined();
    const requestInit = registerCall![1] as RequestInit;
    expect(requestInit.method).toBe("POST");
    const body = JSON.parse(requestInit.body as string);
    expect(body).toMatchObject({
      name: "Casa X",
      description: "Casa de shows no centro.",
      address: "Rua A, 123",
      city: "vitoria",
      contact_phone: "27999990000",
      contact_email: "contato@casax.com",
      registration_email: "cadastro@casax.com",
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
      if (url.includes("/venues/register")) {
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

    render(<VenueSelfRegistrationPage />);

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
