/**
 * Integration test for AT30's Super Admin edit-plan page. No single-plan GET
 * endpoint exists — the page finds the plan inside usePlans()'s listPlans()
 * result, same technique as app/eventos/[id]/editar/page.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditPlanPage from "./page";

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

function basePlan(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    name: "Gratuito",
    monthly_price: 0,
    annual_price: null,
    publish_quota: 5,
    is_active: true,
    is_default_free: true,
    ...overrides,
  };
}

function stubFetch(plans: unknown[], extra?: (url: string, init?: RequestInit) => Response | undefined) {
  const fetchMock = vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/sanctum/csrf-cookie")) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const extraResponse = extra?.(url, init);
    if (extraResponse) return Promise.resolve(extraResponse);
    if (url.includes("/plans")) {
      return Promise.resolve(jsonResponse({ data: plans }));
    }
    return Promise.resolve(jsonResponse({ message: "not found" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("app/planos/[id]/editar/page.tsx (integration, real hooks + client + http stack)", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token";
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("GIVEN the plan exists WHEN /planos/1/editar mounts THEN it renders PlanForm pre-filled with that plan's fields", async () => {
    stubFetch([basePlan({ id: 1, name: "Gratuito" })]);

    render(<EditPlanPage params={Promise.resolve({ id: "1" })} />);

    const nameInput = await screen.findByLabelText("Nome");
    expect(nameInput).toHaveValue("Gratuito");
  });

  test("GIVEN no plan with the given id WHEN /planos/999/editar mounts THEN it shows a pt-BR not-found state", async () => {
    stubFetch([basePlan({ id: 1, name: "Gratuito" })]);

    render(<EditPlanPage params={Promise.resolve({ id: "999" })} />);

    await waitFor(() => expect(screen.getByText(/plano não encontrado/i)).toBeInTheDocument());
  });

  test("GIVEN an edited form WHEN submitted THEN it PATCHes the plan and redirects to /planos", async () => {
    const fetchMock = stubFetch([basePlan({ id: 1, name: "Gratuito" })], (url, init) => {
      if (url.includes("/plans/1") && init?.method === "PATCH") {
        return jsonResponse({ data: basePlan({ id: 1, name: "Gratuito Editado" }) });
      }
      return undefined;
    });

    render(<EditPlanPage params={Promise.resolve({ id: "1" })} />);

    const nameInput = await screen.findByLabelText("Nome");
    const user = userEvent.setup();
    await user.clear(nameInput);
    await user.type(nameInput, "Gratuito Editado");
    await user.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/planos"));
    const editCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes("/plans/1") && (call[1] as RequestInit | undefined)?.method === "PATCH",
    );
    expect(editCall).toBeDefined();
  });
});
