import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  test("GIVEN a Super Admin WHEN the sidebar renders THEN both approval queue links appear", () => {
    render(<Sidebar role="super_admin" userName="Ana" roleLabel="Super Admin" />);

    expect(screen.getByText("Aprovação de Contas")).toBeInTheDocument();
    expect(screen.getByText("Aprovação de Eventos")).toBeInTheDocument();
    expect(screen.queryByText("Meus Eventos")).not.toBeInTheDocument();
  });

  test("GIVEN a Venue Admin WHEN the sidebar renders THEN only Meus Eventos and Dashboard appear", () => {
    render(<Sidebar role="venue_admin" userName="Casa X" roleLabel="Venue Admin" />);

    expect(screen.getByText("Meus Eventos")).toBeInTheDocument();
    expect(screen.queryByText("Aprovação de Contas")).not.toBeInTheDocument();
  });

  test("GIVEN the collapse toggle WHEN clicked THEN nav labels are hidden", async () => {
    const user = userEvent.setup();
    render(<Sidebar role="promoter" userName="DJ" roleLabel="Promoter" />);

    expect(screen.getByText("Meus Eventos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /recolher menu/i }));
    expect(screen.queryByText("Meus Eventos")).not.toBeInTheDocument();
  });

  test("GIVEN onNavigate WHEN a nav item is clicked THEN it is called with the item's href instead of a full navigation", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Sidebar role="promoter" userName="DJ" roleLabel="Promoter" onNavigate={onNavigate} />,
    );

    await user.click(screen.getByText("Meus Eventos"));
    expect(onNavigate).toHaveBeenCalledWith("/eventos");
  });
});
