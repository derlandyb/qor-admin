import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Topbar } from "../Topbar";

describe("Topbar", () => {
  test("GIVEN a userName WHEN rendered THEN it shows the name and its initial avatar", () => {
    render(<Topbar userName="Ana Souza" />);
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  test("GIVEN the + Novo Evento button WHEN clicked THEN onCreateEvent fires", async () => {
    const user = userEvent.setup();
    const onCreateEvent = jest.fn();
    render(<Topbar userName="Ana" onCreateEvent={onCreateEvent} />);

    await user.click(screen.getByRole("button", { name: "+ Novo Evento" }));

    expect(onCreateEvent).toHaveBeenCalledTimes(1);
  });

  test("GIVEN the profile menu WHEN toggled THEN it opens and closes the dropdown", async () => {
    const user = userEvent.setup();
    render(<Topbar userName="Ana" />);

    const trigger = screen.getByRole("button", { name: /Ana/ });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("GIVEN the search input WHEN rendered THEN it has an accessible label", () => {
    render(<Topbar userName="Ana" />);
    expect(screen.getByLabelText("Buscar")).toBeInTheDocument();
  });
});
