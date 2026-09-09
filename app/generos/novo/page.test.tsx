/**
 * Integration test for the Super Admin create-genre page, mirrors
 * app/planos/novo/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewGenrePage from "./page";

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

describe("app/generos/novo/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN a filled create form WHEN submitted THEN it POSTs to /genres and redirects to /generos", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sanctum/csrf-cookie")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.endsWith("/genres")) {
        return Promise.resolve(
          jsonResponse({ data: { id: 2, name: "Samba", slug: "samba", is_active: true } }),
        );
      }
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewGenrePage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Samba");
    await user.click(screen.getByRole("button", { name: "Criar Gênero" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/generos"));
    const createCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).endsWith("/genres") && (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(createCall).toBeDefined();
  });
});
