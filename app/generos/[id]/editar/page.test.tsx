/**
 * Integration test for the Super Admin edit-genre page. No single-genre GET
 * endpoint exists — the page finds the genre inside useGenres()'s
 * listGenres() result, mirrors app/planos/[id]/editar/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditGenrePage from "./page";

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

function baseGenre(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    name: "Rock",
    slug: "rock",
    is_active: true,
    ...overrides,
  };
}

function stubFetch(genres: unknown[], extra?: (url: string, init?: RequestInit) => Response | undefined) {
  const fetchMock = vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/sanctum/csrf-cookie")) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const extraResponse = extra?.(url, init);
    if (extraResponse) return Promise.resolve(extraResponse);
    if (url.includes("/genres")) {
      return Promise.resolve(jsonResponse({ data: genres }));
    }
    return Promise.resolve(jsonResponse({ message: "not found" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("app/generos/[id]/editar/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN the genre exists WHEN /generos/1/editar mounts THEN it renders GenreForm pre-filled with that genre's name", async () => {
    stubFetch([baseGenre({ id: 1, name: "Rock" })]);

    render(<EditGenrePage params={Promise.resolve({ id: "1" })} />);

    const nameInput = await screen.findByLabelText("Nome");
    expect(nameInput).toHaveValue("Rock");
  });

  test("GIVEN no genre with the given id WHEN /generos/999/editar mounts THEN it shows a pt-BR not-found state", async () => {
    stubFetch([baseGenre({ id: 1, name: "Rock" })]);

    render(<EditGenrePage params={Promise.resolve({ id: "999" })} />);

    await waitFor(() => expect(screen.getByText(/gênero não encontrado/i)).toBeInTheDocument());
  });

  test("GIVEN an edited form WHEN submitted THEN it PATCHes the genre and redirects to /generos", async () => {
    const fetchMock = stubFetch([baseGenre({ id: 1, name: "Rock" })], (url, init) => {
      if (url.includes("/genres/1") && init?.method === "PATCH") {
        return jsonResponse({ data: baseGenre({ id: 1, name: "Rock Nacional" }) });
      }
      return undefined;
    });

    render(<EditGenrePage params={Promise.resolve({ id: "1" })} />);

    const nameInput = await screen.findByLabelText("Nome");
    const user = userEvent.setup();
    await user.clear(nameInput);
    await user.type(nameInput, "Rock Nacional");
    await user.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/generos"));
    const editCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes("/genres/1") && (call[1] as RequestInit | undefined)?.method === "PATCH",
    );
    expect(editCall).toBeDefined();
  });
});
