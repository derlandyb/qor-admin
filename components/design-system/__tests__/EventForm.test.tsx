import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "../EventForm";

describe("EventForm", () => {
  it("GIVEN mode=create WHEN submitted empty THEN blocks submit and shows required-field pt-BR errors", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<EventForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Criar evento" }));

    expect(await screen.findByText("O título é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("A descrição é obrigatória.")).toBeInTheDocument();
    expect(screen.getByText("A data de início é obrigatória.")).toBeInTheDocument();
    expect(screen.getByText("A cidade é obrigatória.")).toBeInTheDocument();
    expect(screen.getByText("O gênero é obrigatório.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN is_free unchecked WHEN ticket_url is empty THEN shows the paid-event ticket-link error and blocks submit", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<EventForm mode="create" onSubmit={onSubmit} />);

    // is_free defaults to false (unchecked) — required-field errors will also
    // fire, but the ticket_url error must be present regardless.
    await user.click(screen.getByRole("button", { name: "Criar evento" }));

    expect(
      await screen.findByText("Eventos pagos precisam de um link de ingresso."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN is_free checked WHEN ticket_url is empty THEN does not require a ticket link", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<EventForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText("Evento gratuito"));
    await user.type(screen.getByLabelText("Título"), "Show da Banda");
    await user.type(screen.getByLabelText("Descrição"), "Um show incrível");
    await user.type(
      screen.getByLabelText("Data de início"),
      "2026-09-01T20:00",
    );
    await user.selectOptions(screen.getByLabelText("Cidade"), "vitoria");
    await user.type(screen.getByLabelText("Gênero (ID)"), "3");
    await user.click(screen.getByRole("button", { name: "Criar evento" }));

    expect(
      screen.queryByText("Eventos pagos precisam de um link de ingresso."),
    ).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.is_free).toBe(true);
    expect(payload.ticket_url).toBeNull();
  });

  it("GIVEN mode=edit WHEN submitted with only is_free explicitly false and no ticket_url THEN blocks submit with the ticket-link error but not other required-field errors", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<EventForm mode="edit" initialValues={{ is_free: false }} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Eventos pagos precisam de um link de ingresso."),
    ).toBeInTheDocument();
    expect(screen.queryByText("O título é obrigatório.")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN mode=edit WHEN submitted with no fields touched and is_free true THEN allows submit (all fields optional)", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<EventForm mode="edit" initialValues={{ is_free: true }} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("GIVEN the title input WHEN rendered THEN its className carries the 150ms ease-in-out focus transition tokens", () => {
    render(<EventForm mode="create" onSubmit={jest.fn()} />);
    const input = screen.getByLabelText("Título");
    expect(input.className).toContain("duration-admin-control");
    expect(input.className).toContain("ease-admin-control");
    expect(input.className).toContain("transition-[border-color,box-shadow]");
  });

  it("GIVEN the is_free checkbox WHEN rendered THEN its className carries no transition utility", () => {
    render(<EventForm mode="create" onSubmit={jest.fn()} />);
    const checkbox = screen.getByLabelText("Evento gratuito");
    expect(checkbox.className).not.toContain("transition");
    expect(checkbox.className).toContain("rounded-admin-checkbox");
  });

  it("GIVEN a cover_image file input WHEN rendered THEN accepts only image files", () => {
    render(<EventForm mode="create" onSubmit={jest.fn()} />);
    const input = screen.getByLabelText("Imagem de capa (opcional)");
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", "image/*");
  });
});
