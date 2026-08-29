import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CadastroLocalPage from "@/app/cadastro/local/page";
import { apiClient, ApiError } from "@/lib/api/client";

/**
 * Mocks only the network boundary (`@/lib/api/client`) so the real
 * `useVenueRegistration` hook, `RegistrationForm`, and this page are
 * exercised together end to end.
 */
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    venues: {
      register: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;
    constructor(message: string, status: number, errors?: Record<string, string[]>) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.errors = errors;
    }
  },
}));

const mockedRegister = apiClient.venues.register as jest.Mock;

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
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
}

describe("CadastroLocalPage", () => {
  beforeEach(() => {
    mockedRegister.mockReset();
  });

  it("GIVEN a valid venue form WHEN submitted THEN calls the client with the registration payload and shows the success state", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValueOnce({
      data: {
        id: 1,
        name: "Casa de Shows X",
        description: "Uma casa de shows",
        address: "Rua Principal, 123",
        city: "vitoria",
        contact_phone: "27999999999",
        contact_email: "contato@casa.com",
        approval_status: "pending_approval",
        image_url: null,
      },
    });

    render(<CadastroLocalPage />);

    expect(screen.getByRole("heading", { name: "Cadastro de Local" })).toBeInTheDocument();

    await fillAndSubmit(user);

    expect(mockedRegister).toHaveBeenCalledWith({
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

    expect(
      await screen.findByText("Cadastro enviado! Sua conta será analisada pela nossa equipe."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("GIVEN a failed registration WHEN submitted THEN surfaces the pt-BR error via RegistrationForm's serverError prop", async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(new ApiError("E-mail já cadastrado.", 422));

    render(<CadastroLocalPage />);

    await fillAndSubmit(user);

    expect(await screen.findByText("E-mail já cadastrado.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });
});
