import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { Sidebar } from "../Sidebar";

describe("Sidebar", () => {
  test("GIVEN role is super_admin WHEN Sidebar renders THEN it shows Dashboard, both approval queues, and Planos, but not Meus Eventos or Assinatura", () => {
    render(<Sidebar role="super_admin" />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /aprovação de contas/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /aprovação de eventos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planos" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /meus eventos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /assinatura/i })).not.toBeInTheDocument();
  });

  test("GIVEN role is venue_admin WHEN Sidebar renders THEN it shows Dashboard, Meus Eventos, and Assinatura, but not either approval queue or Planos", () => {
    render(<Sidebar role="venue_admin" />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meus eventos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /assinatura/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /aprovação de contas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /aprovação de eventos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Planos" })).not.toBeInTheDocument();
  });

  test("GIVEN role is promoter WHEN Sidebar renders THEN it shows Dashboard and Meus Eventos but not either approval queue", () => {
    render(<Sidebar role="promoter" />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meus eventos/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /aprovação de contas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /aprovação de eventos/i })).not.toBeInTheDocument();
  });

  test("GIVEN the current route matches a nav item WHEN Sidebar renders THEN that item is marked aria-current page", () => {
    render(<Sidebar role="super_admin" />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /aprovação de contas/i })).not.toHaveAttribute("aria-current");
  });
});
