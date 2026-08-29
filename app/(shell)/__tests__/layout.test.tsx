import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@/lib/api/client";
import { PROFILE_COOKIE_NAME } from "@/lib/api/session-cookie";
import ShellLayout from "../layout";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/dashboard",
}));

jest.mock("@/lib/api/client", () => ({
  apiClient: { auth: { logout: jest.fn().mockResolvedValue({ message: "Sessão encerrada." }) } },
}));

function setProfileCookie(value: object | null) {
  if (value === null) {
    document.cookie = `${PROFILE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    return;
  }
  document.cookie = `${PROFILE_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}`;
}

describe("ShellLayout", () => {
  afterEach(() => {
    setProfileCookie(null);
    jest.clearAllMocks();
  });

  test("GIVEN no profile cookie WHEN the shell mounts THEN it redirects to /entrar and renders nothing", async () => {
    const { container } = render(<ShellLayout>conteúdo</ShellLayout>);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/entrar"));
    expect(container).toBeEmptyDOMElement();
  });

  test("GIVEN a Super Admin profile cookie WHEN the shell mounts THEN it renders the Sidebar/Topbar with the super_admin nav", async () => {
    setProfileCookie({ name: "Ana Souza", isSuperAdmin: true });
    render(<ShellLayout>conteúdo</ShellLayout>);

    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /aprovação de contas/i })).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  test("GIVEN a non-Super-Admin profile cookie WHEN the shell mounts THEN it renders the organizer nav, not the approval queues", async () => {
    setProfileCookie({ name: "Casa de Shows", isSuperAdmin: false });
    render(<ShellLayout>conteúdo</ShellLayout>);

    expect(await screen.findByText("Casa de Shows")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meus eventos/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /aprovação de contas/i })).not.toBeInTheDocument();
  });

  test("GIVEN the profile menu's Sair action WHEN clicked THEN it logs out and redirects to /entrar", async () => {
    setProfileCookie({ name: "Ana Souza", isSuperAdmin: true });
    const user = userEvent.setup();
    render(<ShellLayout>conteúdo</ShellLayout>);

    await screen.findByText("Ana Souza");
    await user.click(screen.getByRole("button", { name: /ana souza/i }));
    await user.click(screen.getByRole("menuitem", { name: "Sair" }));

    expect(apiClient.auth.logout).toHaveBeenCalled();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/entrar"));
  });

  test("GIVEN the + Novo Evento button WHEN clicked THEN it navigates to /eventos/novo", async () => {
    setProfileCookie({ name: "Casa de Shows", isSuperAdmin: false });
    const user = userEvent.setup();
    render(<ShellLayout>conteúdo</ShellLayout>);

    await screen.findByText("Casa de Shows");
    await user.click(screen.getByRole("button", { name: "+ Novo Evento" }));

    expect(push).toHaveBeenCalledWith("/eventos/novo");
  });
});
