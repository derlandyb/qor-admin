import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "./EventForm";

describe("EventForm", () => {
  test("GIVEN a paid event with no ticket link WHEN submitted THEN it blocks submit with the ticket_url error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EventForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Título"), "Show");
    await user.type(screen.getByLabelText("Descrição"), "desc");
    await user.type(screen.getByLabelText("Gênero"), "1");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("O link do ingresso é obrigatório para eventos pagos."),
    ).toBeInTheDocument();
  });

  test("GIVEN a free event toggle WHEN checked THEN the ticket link field disappears", async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Link do ingresso")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Evento gratuito"));
    expect(screen.queryByLabelText("Link do ingresso")).not.toBeInTheDocument();
  });
});
