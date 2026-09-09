import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenreForm } from "./GenreForm";

describe("GenreForm", () => {
  test("GIVEN the name field left empty WHEN submitted THEN it blocks submit and shows a pt-BR field error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GenreForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome").closest("div")).toHaveTextContent(
      "Este campo é obrigatório.",
    );
  });

  test("GIVEN a filled name WHEN submitted THEN onSubmit receives the values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GenreForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Rock");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Rock" });
  });

  test("GIVEN initialValues WHEN it renders THEN the name field is pre-filled for editing", () => {
    render(
      <GenreForm initialValues={{ name: "Rock" }} onSubmit={vi.fn()} submitLabel="Salvar Alterações" />,
    );

    expect(screen.getByLabelText("Nome")).toHaveValue("Rock");
    expect(screen.getByRole("button", { name: "Salvar Alterações" })).toBeInTheDocument();
  });
});
