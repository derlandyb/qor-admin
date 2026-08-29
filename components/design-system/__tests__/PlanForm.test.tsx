import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanForm } from "../PlanForm";

describe("PlanForm", () => {
  it("GIVEN mode=create WHEN submitted empty THEN blocks submit and shows field-specific pt-BR errors", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PlanForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Criar plano" }));

    expect(await screen.findByText("O nome do plano é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("O preço mensal é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("A cota de publicações é obrigatória.")).toBeInTheDocument();
    expect(screen.queryByText("O preço anual deve ser um número.")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN a negative monthly_price WHEN submitted THEN shows the negative-value pt-BR error", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PlanForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome do plano"), "Plano Pro");
    await user.type(screen.getByLabelText("Preço mensal"), "-10");
    await user.type(screen.getByLabelText("Cota de publicações"), "5");
    await user.click(screen.getByRole("button", { name: "Criar plano" }));

    expect(
      await screen.findByText("O preço mensal não pode ser negativo."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN a non-integer publish_quota WHEN submitted THEN shows the integer pt-BR error", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PlanForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome do plano"), "Plano Pro");
    await user.type(screen.getByLabelText("Preço mensal"), "10");
    await user.type(screen.getByLabelText("Cota de publicações"), "2.5");
    await user.click(screen.getByRole("button", { name: "Criar plano" }));

    expect(
      await screen.findByText("A cota de publicações deve ser um número inteiro."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN annual_price left blank WHEN the rest is filled validly THEN does not block submit and payload carries annual_price: null", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PlanForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome do plano"), "Plano Pro");
    await user.type(screen.getByLabelText("Preço mensal"), "49.9");
    await user.type(screen.getByLabelText("Cota de publicações"), "10");
    await user.click(screen.getByRole("button", { name: "Criar plano" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Plano Pro",
      monthly_price: 49.9,
      annual_price: null,
      publish_quota: 10,
    });
  });

  it("GIVEN all fields filled including annual_price THEN onSubmit is called with a full PlanPayload", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PlanForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome do plano"), "Plano Pro");
    await user.type(screen.getByLabelText("Preço mensal"), "49.9");
    await user.type(screen.getByLabelText("Preço anual (opcional)"), "499");
    await user.type(screen.getByLabelText("Cota de publicações"), "10");
    await user.click(screen.getByRole("button", { name: "Criar plano" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Plano Pro",
      monthly_price: 49.9,
      annual_price: 499,
      publish_quota: 10,
    });
  });

  it("GIVEN mode=edit WHEN rendered THEN uses the edit submit label", () => {
    render(<PlanForm mode="edit" onSubmit={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("GIVEN initialValues WHEN rendered THEN pre-fills the fields", () => {
    render(
      <PlanForm
        mode="edit"
        onSubmit={jest.fn()}
        initialValues={{ name: "Plano Básico", monthly_price: 19.9, publish_quota: 3 }}
      />,
    );

    expect(screen.getByLabelText("Nome do plano")).toHaveValue("Plano Básico");
    expect(screen.getByLabelText("Preço mensal")).toHaveValue(19.9);
    expect(screen.getByLabelText("Cota de publicações")).toHaveValue(3);
    expect(screen.getByLabelText("Preço anual (opcional)")).toHaveValue(null);
  });

  it("GIVEN serverError prop WHEN rendered THEN displays it", () => {
    render(<PlanForm mode="create" onSubmit={jest.fn()} serverError="Plano já existe." />);
    expect(screen.getByText("Plano já existe.")).toBeInTheDocument();
  });

  it("GIVEN isSubmitting=true WHEN rendered THEN disables the submit button and shows the loading label", () => {
    render(<PlanForm mode="create" onSubmit={jest.fn()} isSubmitting />);
    const button = screen.getByRole("button", { name: "Enviando..." });
    expect(button).toBeDisabled();
  });
});
