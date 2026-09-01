import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "./RegistrationForm";

describe("RegistrationForm (venue)", () => {
  test("GIVEN required fields left empty WHEN submitted THEN it blocks submit and shows pt-BR field errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm type="venue" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome").closest("div")).toHaveTextContent(
      "Este campo é obrigatório.",
    );
    expect(screen.getByText("É necessário aceitar os termos de uso.")).toBeInTheDocument();
  });

  test("GIVEN a fully filled valid form WHEN submitted THEN onSubmit receives the values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm type="venue" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Casa de Shows");
    await user.type(screen.getByLabelText("Descrição"), "Live music venue");
    await user.type(screen.getByLabelText("Endereço"), "Rua X, 100");
    await user.type(screen.getByLabelText("Telefone de contato"), "27999999999");
    await user.type(screen.getByLabelText("E-mail de contato"), "contato@casa.com");
    await user.type(screen.getByLabelText("E-mail de cadastro"), "admin@casa.com");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getByLabelText("Aceito os termos de uso"));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Casa de Shows", terms_accepted: true }),
    );
  });
});

describe("RegistrationForm (promoter)", () => {
  test("GIVEN the promoter variant WHEN it renders THEN it shows promoter-specific fields, not venue fields", () => {
    render(<RegistrationForm type="promoter" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
    expect(screen.queryByLabelText("Endereço")).not.toBeInTheDocument();
  });

  test("GIVEN required fields left empty WHEN submitted THEN it blocks submit and shows pt-BR field errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm type="promoter" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("É necessário aceitar os termos de uso.")).toBeInTheDocument();
  });

  test("GIVEN a fully filled valid promoter form WHEN submitted THEN onSubmit receives the values, including optional Instagram/TikTok", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm type="promoter" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "DJ Promo");
    await user.type(screen.getByLabelText("Telefone de contato"), "27988888888");
    await user.type(screen.getByLabelText("E-mail de contato"), "dj@promo.com");
    await user.type(screen.getByLabelText("Instagram"), "@djpromo");
    await user.type(screen.getByLabelText("TikTok"), "@djpromo");
    await user.type(screen.getByLabelText("E-mail de cadastro"), "dj@promo.com");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getByLabelText("Aceito os termos de uso"));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "DJ Promo", instagram: "@djpromo", terms_accepted: true }),
    );
  });
});
