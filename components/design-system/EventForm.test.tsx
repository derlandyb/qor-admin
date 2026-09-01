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

  test("GIVEN a fully filled free event WHEN submitted THEN onSubmit receives every field, including the optional ones", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EventForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Título"), "Show Gratuito");
    await user.type(screen.getByLabelText("Descrição"), "desc");
    await user.type(screen.getByLabelText("Data e hora"), "2026-11-01T20:00");
    await user.type(screen.getByLabelText("Gênero"), "3");
    await user.type(screen.getByLabelText(/Endereço/), "Praça Central");
    await user.click(screen.getByLabelText("Evento gratuito"));
    await user.type(screen.getByLabelText(/Capacidade/), "200");
    await user.type(screen.getByLabelText(/Classificação etária/), "16");
    await user.type(screen.getByLabelText(/Notas/), "Levar documento");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Show Gratuito",
        is_free: true,
        capacity: 200,
        age_rating: "16",
        notes: "Levar documento",
      }),
    );
  });

  test("GIVEN initialValues and a custom submitLabel WHEN it renders THEN the fields are pre-filled and the button shows the custom label", () => {
    render(
      <EventForm
        initialValues={{ title: "Show Existente", is_free: true }}
        onSubmit={vi.fn()}
        submitLabel="Atualizar"
      />,
    );

    expect(screen.getByLabelText("Título")).toHaveValue("Show Existente");
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeInTheDocument();
  });

  test("GIVEN a cover image file WHEN selected THEN it is included on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EventForm onSubmit={onSubmit} />);

    const file = new File(["cover"], "cover.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/Imagem de capa/), file);
    await user.type(screen.getByLabelText("Título"), "Show");
    await user.type(screen.getByLabelText("Descrição"), "desc");
    await user.type(screen.getByLabelText("Data e hora"), "2026-11-01T20:00");
    await user.type(screen.getByLabelText("Gênero"), "1");
    await user.click(screen.getByLabelText("Evento gratuito"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ cover_image: file }));
  });
});
