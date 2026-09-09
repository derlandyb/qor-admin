/**
 * Integration test for the Super Admin genre list page, mirrors
 * app/planos/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenresPage from "./page";

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

function genresPage(): Response {
  return jsonResponse({
    data: [{ id: 1, name: "Rock", slug: "rock", is_active: true }],
  });
}

describe("app/generos/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN genres exist WHEN the page mounts THEN it renders the genre table", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(genresPage())));

    render(<GenresPage />);

    await waitFor(() => expect(screen.getByText("Rock")).toBeInTheDocument());
  });

  test("GIVEN Novo Gênero is clicked THEN it navigates to /generos/novo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(genresPage())));

    render(<GenresPage />);
    await waitFor(() => expect(screen.getByText("Rock")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Novo Gênero" }));

    expect(pushMock).toHaveBeenCalledWith("/generos/novo");
  });

  test("GIVEN an active genre WHEN Desativar is confirmed THEN it POSTs to /genres/{id}/deactivate", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/deactivate")) {
        return Promise.resolve(
          jsonResponse({ data: { id: 1, name: "Rock", slug: "rock", is_active: false } }),
        );
      }
      return Promise.resolve(genresPage());
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<GenresPage />);
    await waitFor(() => expect(screen.getByText("Rock")).toBeInTheDocument());

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
    expect(String(deactivateCall[0])).toContain("/genres/1/deactivate");
  });

  test("GIVEN an inactive genre WHEN Ativar is confirmed THEN it POSTs to /genres/{id}/activate", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes("/activate")) {
        return Promise.resolve(
          jsonResponse({ data: { id: 1, name: "Rock", slug: "rock", is_active: true } }),
        );
      }
      return Promise.resolve(
        jsonResponse({ data: [{ id: 1, name: "Rock", slug: "rock", is_active: false }] }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<GenresPage />);
    await waitFor(() => expect(screen.getByText("Rock")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Ativar" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Ativar" }));

    await waitFor(() => {
      const activateCall = fetchMock.mock.calls.find((call) =>
        String(call[0]).includes("/activate"),
      );
      expect(activateCall).toBeDefined();
    });
    const activateCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/activate"))!;
    expect(String(activateCall[0])).toContain("/genres/1/activate");
  });

  test("GIVEN the server rejects the request WHEN the page mounts THEN it renders the pt-BR error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Acesso negado." }, 403)),
    );

    render(<GenresPage />);

    await waitFor(() => expect(screen.getByText("Acesso negado.")).toBeInTheDocument());
  });
});
