import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanForm } from "./PlanForm";

describe("PlanForm", () => {
  test("GIVEN required fields left empty WHEN submitted THEN it blocks submit and shows pt-BR field errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PlanForm onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText("Nome"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome").closest("div")).toHaveTextContent(
      "Este campo é obrigatório.",
    );
  });

  test("GIVEN publish_quota left empty WHEN submitted THEN it blocks submit with a field-specific pt-BR error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PlanForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Pro");
    await user.clear(screen.getByLabelText("Cota de publicações mensais"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Cota de publicações mensais").closest("div")).toHaveTextContent(
      "Este campo é obrigatório.",
    );
  });

  test("GIVEN a fully filled valid form WHEN submitted THEN onSubmit receives the values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PlanForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Pro");
    await user.clear(screen.getByLabelText("Preço mensal"));
    await user.type(screen.getByLabelText("Preço mensal"), "29.9");
    await user.clear(screen.getByLabelText("Cota de publicações mensais"));
    await user.type(screen.getByLabelText("Cota de publicações mensais"), "20");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Pro", monthly_price: 29.9, publish_quota: 20 }),
    );
  });

  test("GIVEN initialValues WHEN it renders THEN fields are pre-filled for editing", () => {
    render(
      <PlanForm
        initialValues={{ name: "Gratuito", monthly_price: 0, publish_quota: 5 }}
        onSubmit={vi.fn()}
        submitLabel="Salvar Alterações"
      />,
    );

    expect(screen.getByLabelText("Nome")).toHaveValue("Gratuito");
    expect(screen.getByRole("button", { name: "Salvar Alterações" })).toBeInTheDocument();
  });
});
