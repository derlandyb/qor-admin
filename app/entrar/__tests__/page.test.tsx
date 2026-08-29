import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EntrarPage from "@/app/entrar/page";
import { apiClient, ApiError } from "@/lib/api/client";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    auth: {
      login: jest.fn(),
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

const mockedLogin = apiClient.auth.login as jest.Mock;

describe("EntrarPage", () => {
  beforeEach(() => {
    push.mockClear();
    mockedLogin.mockReset();
  });

  test("GIVEN empty fields WHEN submitting THEN shows required-field errors and does not call the client", async () => {
    const user = userEvent.setup();
    render(<EntrarPage />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("O e-mail é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("A senha é obrigatória.")).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  test("GIVEN a failed login WHEN submitting THEN shows the API error message", async () => {
    mockedLogin.mockRejectedValueOnce(new ApiError("Credenciais inválidas.", 422));
    const user = userEvent.setup();
    render(<EntrarPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "admin@qor.com");
    await user.type(screen.getByLabelText(/senha/i), "senha123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Credenciais inválidas.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  test("GIVEN a successful login WHEN submitting THEN redirects to /dashboard", async () => {
    mockedLogin.mockResolvedValueOnce({
      data: { id: 1, name: "Admin", email: "admin@qor.com", permissions: [] },
    });
    const user = userEvent.setup();
    render(<EntrarPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "admin@qor.com");
    await user.type(screen.getByLabelText(/senha/i), "senha123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(mockedLogin).toHaveBeenCalledWith("admin@qor.com", "senha123");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });
});
