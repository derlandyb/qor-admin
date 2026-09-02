/**
 * AT22 — integration test exercising the real useSession() -> client ->
 * http.ts stack against a mocked global fetch, same technique as this
 * session's page-level integration tests (see app/aprovacoes/contas/page.test.tsx).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppShell } from "./AppShell";

const pushMock = vi.fn();
const replaceMock = vi.fn();
let currentPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AppShell (integration, real useSession + client + http stack)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    currentPathname = "/dashboard";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN the /entrar route WHEN AppShell renders THEN it shows children bare, with no sidebar/topbar chrome", async () => {
    currentPathname = "/entrar";
    // useSession() still runs unconditionally (React's rules of hooks — a
    // hook call can't be skipped based on pathname) but that's harmless
    // here: it's a quiet background /me check, not something this route
    // needs to gate rendering on.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Não autenticado." }, 401)));

    render(
      <AppShell>
        <p>Formulário de login</p>
      </AppShell>,
    );

    expect(screen.getByText("Formulário de login")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("GIVEN a super_admin session WHEN AppShell renders a non-login route THEN it wraps children in the role-aware Sidebar/Topbar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: { id: 1, name: "Ana Admin", email: "ana@qor.app", permissions: [], account_type: "super_admin" },
        }),
      ),
    );

    render(
      <AppShell>
        <p>Conteúdo protegido</p>
      </AppShell>,
    );

    await waitFor(() => expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument());
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Aprovação de Contas")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("GIVEN a venue_admin session WHEN AppShell renders THEN the Super-Admin-only nav items are hidden", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: { id: 2, name: "Dono do Local", email: "v@qor.app", permissions: [], account_type: "venue_admin" },
        }),
      ),
    );

    render(
      <AppShell>
        <p>Conteúdo protegido</p>
      </AppShell>,
    );

    await waitFor(() => expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument());
    expect(screen.queryByText("Aprovação de Contas")).not.toBeInTheDocument();
    expect(screen.getByText("Meus Eventos")).toBeInTheDocument();
  });

  test("GIVEN an unauthenticated visitor WHEN AppShell renders a protected route THEN it redirects to /entrar without flashing protected content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Não autenticado." }, 401)));

    render(
      <AppShell>
        <p>Conteúdo protegido</p>
      </AppShell>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/entrar"));
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  test.each(["/cadastro/local", "/cadastro/promotor"])(
    "GIVEN an unauthenticated visitor WHEN AppShell renders %s THEN it shows the page bare, with no redirect and no chrome",
    async (path) => {
      currentPathname = path;
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Não autenticado." }, 401)));

      render(
        <AppShell>
          <p>Formulário de cadastro</p>
        </AppShell>,
      );

      expect(screen.getByText("Formulário de cadastro")).toBeInTheDocument();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      expect(replaceMock).not.toHaveBeenCalled();
    },
  );
});
