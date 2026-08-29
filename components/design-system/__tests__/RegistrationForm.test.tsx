import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "../RegistrationForm";

describe("RegistrationForm", () => {
  it("GIVEN kind=venue WHEN submitted empty THEN blocks submit and shows field-specific pt-BR errors", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<RegistrationForm kind="venue" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("O nome é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("A descrição é obrigatória.")).toBeInTheDocument();
    expect(screen.getByText("O endereço é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("A cidade é obrigatória.")).toBeInTheDocument();
    expect(screen.getByText("O telefone de contato é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("O e-mail de contato é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("O e-mail de cadastro é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("A senha é obrigatória.")).toBeInTheDocument();
    expect(screen.getByText("É necessário aceitar os termos de uso.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN kind=promoter WHEN submitted empty THEN shows promoter field errors without venue-only fields", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<RegistrationForm kind="promoter" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("O nome é obrigatório.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Descrição")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Endereço")).not.toBeInTheDocument();
    expect(screen.getByText("É necessário aceitar os termos de uso.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("GIVEN kind=venue WHEN all fields are filled validly THEN onSubmit is called with a RegisterVenuePayload", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<RegistrationForm kind="venue" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Casa de Shows X");
    await user.type(screen.getByLabelText("Descrição"), "Uma casa de shows");
    await user.type(screen.getByLabelText("Endereço"), "Rua Principal, 123");
    await user.selectOptions(screen.getByLabelText("Cidade"), "vitoria");
    await user.type(screen.getByLabelText("Telefone de contato"), "27999999999");
    await user.type(screen.getByLabelText("E-mail de contato"), "contato@casa.com");
    await user.type(screen.getByLabelText("E-mail de cadastro"), "cadastro@casa.com");
    await user.type(screen.getByLabelText("Senha"), "Senha1234");
    await user.click(screen.getByLabelText("Aceito os termos de uso"));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Casa de Shows X",
      description: "Uma casa de shows",
      address: "Rua Principal, 123",
      city: "vitoria",
      contact_phone: "27999999999",
      contact_email: "contato@casa.com",
      registration_email: "cadastro@casa.com",
      password: "Senha1234",
      terms_accepted: true,
    });
  });

  it("GIVEN serverError prop WHEN rendered THEN displays it", () => {
    render(
      <RegistrationForm kind="venue" onSubmit={jest.fn()} serverError="E-mail já cadastrado." />,
    );
    expect(screen.getByText("E-mail já cadastrado.")).toBeInTheDocument();
  });

  it("GIVEN the name input WHEN rendered THEN its className carries the 150ms ease-in-out focus transition tokens", () => {
    render(<RegistrationForm kind="venue" onSubmit={jest.fn()} />);
    const input = screen.getByLabelText("Nome");
    expect(input.className).toContain("duration-admin-control");
    expect(input.className).toContain("ease-admin-control");
    expect(input.className).toContain("transition-[border-color,box-shadow]");
  });

  it("GIVEN the terms checkbox WHEN rendered THEN its className carries no transition utility", () => {
    render(<RegistrationForm kind="venue" onSubmit={jest.fn()} />);
    const checkbox = screen.getByLabelText("Aceito os termos de uso");
    expect(checkbox.className).not.toContain("transition");
    expect(checkbox.className).toContain("rounded-admin-checkbox");
  });
});
