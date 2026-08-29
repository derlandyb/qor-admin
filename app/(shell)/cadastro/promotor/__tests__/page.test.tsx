import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CadastroPromotorPage from "../page";
import { apiClient, ApiError } from "@/lib/api/client";

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    promoters: {
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

const mockedRegister = apiClient.promoters.register as jest.Mock;

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^nome$/i), "Produtora X");
  await user.type(screen.getByLabelText(/telefone de contato/i), "27999999999");
  await user.type(screen.getByLabelText(/e-mail de contato/i), "promoter@qor.app");
  await user.type(screen.getByLabelText(/e-mail de cadastro/i), "login@qor.app");
  await user.type(screen.getByLabelText(/^senha$/i), "Senha1234");
  await user.click(screen.getByLabelText(/aceito os termos de uso/i));
}

describe("CadastroPromotorPage", () => {
  beforeEach(() => {
    mockedRegister.mockReset();
  });

  test("GIVEN a valid form WHEN submitting THEN calls the client with the right payload and shows the success state", async () => {
    mockedRegister.mockResolvedValueOnce({
      data: {
        id: 1,
        name: "Produtora X",
        contact_phone: "27999999999",
        contact_email: "promoter@qor.app",
        instagram: null,
        tiktok: null,
        approval_status: "pending_approval",
      },
    });

    const user = userEvent.setup();
    render(<CadastroPromotorPage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(mockedRegister).toHaveBeenCalledWith({
      name: "Produtora X",
      contact_phone: "27999999999",
      contact_email: "promoter@qor.app",
      instagram: null,
      tiktok: null,
      registration_email: "login@qor.app",
      password: "Senha1234",
      terms_accepted: true,
    });

    expect(
      await screen.findByText("Cadastro enviado! Sua conta será analisada pela nossa equipe."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cadastrar/i })).not.toBeInTheDocument();
  });

  test("GIVEN a failed registration WHEN submitting THEN shows the server error and keeps the form", async () => {
    mockedRegister.mockRejectedValueOnce(new ApiError("E-mail já cadastrado.", 422));

    const user = userEvent.setup();
    render(<CadastroPromotorPage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(await screen.findByText("E-mail já cadastrado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cadastrar/i })).toBeInTheDocument();
  });
});
