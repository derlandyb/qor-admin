/**
 * Integration test for AT15's admin login page: exercises the rendered page
 * against a mocked global fetch (same technique as hooks/__tests__/*.integration.test.tsx),
 * except for the already-authenticated-visitor case, which mocks useSession()
 * directly since that scenario is about useSession()'s resolved state, not
 * the fetch stack.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

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

describe("app/entrar/page.tsx (integration, real client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  test("GIVEN an unauthenticated visitor WHEN /entrar mounts THEN it renders the login form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Não autenticado." }, 401)),
    );

    render(<LoginPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/manter conectado/i)).toBeInTheDocument();
    expect(screen.getByText(/esqueci minha senha/i)).toBeInTheDocument();
  });

  test("GIVEN valid credentials WHEN the form is submitted THEN a successful login redirects to /dashboard", async () => {
    // URL-routed (rather than call-order-routed) since http.ts's one-time
    // /sanctum/csrf-cookie bootstrap flag is module state shared across
    // tests in this file, so a fixed call-order queue would desync.
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/auth/login")) {
        return Promise.resolve(
          jsonResponse({
            data: { id: 1, account_type: "venue_admin", email: "a@a.com" },
            token: "irrelevant",
          }),
        );
      }
      return Promise.resolve(jsonResponse({ message: "Não autenticado." }, 401));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument(),
    );

    await userEvent.type(screen.getByLabelText(/e-mail/i), "a@a.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  test("GIVEN a 422 response WHEN the form is submitted THEN field-level pt-BR errors render under the matching inputs", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/auth/login")) {
        return Promise.resolve(
          jsonResponse(
            {
              message: "Os dados fornecidos são inválidos.",
              errors: { email: ["O campo e-mail é obrigatório."] },
            },
            422,
          ),
        );
      }
      return Promise.resolve(jsonResponse({ message: "Não autenticado." }, 401));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument(),
    );

    await userEvent.type(screen.getByLabelText(/e-mail/i), "a@a.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() =>
      expect(screen.getByText("O campo e-mail é obrigatório.")).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  test("GIVEN a non-422 ApiError WHEN the form is submitted THEN the page-level error banner renders its message", async () => {
    // The login POST itself returns 401 here (bad credentials) — distinct
    // from useSession()'s own 401 on mount, which is the expected steady
    // state for a not-yet-logged-in visitor.
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/auth/login")) {
        return Promise.resolve(jsonResponse({ message: "Credenciais inválidas." }, 401));
      }
      return Promise.resolve(jsonResponse({ message: "Não autenticado." }, 401));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument(),
    );

    await userEvent.type(screen.getByLabelText(/e-mail/i), "a@a.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() =>
      expect(screen.getByText("Credenciais inválidas.")).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  test("GIVEN an already-authenticated visitor WHEN /entrar mounts THEN it redirects immediately to /dashboard", async () => {
    vi.doMock("../../hooks/useSession", () => ({
      useSession: () => ({
        account: { id: 1, account_type: "venue_admin", email: "a@a.com" },
        venue: null,
        promoter: null,
        loading: false,
        error: null,
      }),
    }));

    const { default: MockedLoginPage } = await import("./page");

    render(<MockedLoginPage />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });
});
