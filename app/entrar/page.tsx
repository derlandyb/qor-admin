"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api/client";
import { Button } from "@/components/design-system/Button";

/**
 * Same dark-fill input convention as RegistrationForm's INPUT_CLASS
 * (design-system-admin.md §5.8) — not imported from there since Field is
 * colocated/unexported in that file, so it's re-declared here to match.
 */
const INPUT_CLASS =
  "w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-input px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary placeholder:text-admin-text-secondary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]";

const CHECKBOX_CLASS =
  "h-4 w-4 rounded-admin-checkbox border border-admin-border-subtle bg-white text-admin-primary";

interface FormState {
  email: string;
  password: string;
}

const INITIAL_STATE: FormState = { email: "", password: "" };

type FieldErrors = Partial<Record<keyof FormState, string>>;

// Mirrors api/src/Http/Requests/Api/AdminV1/LoginRequest.php's pt-BR
// required-field messages.
function validate(state: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!state.email.trim()) {
    errors.email = "O e-mail é obrigatório.";
  }

  if (!state.password.trim()) {
    errors.password = "A senha é obrigatória.";
  }

  return errors;
}

export default function EntrarPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setState((previous) => ({ ...previous, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const fieldErrors = validate(state);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.auth.login(state.email, state.password);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Ocorreu um erro inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-admin-bg-body px-4">
      <div className="w-full max-w-[420px] rounded-admin-card bg-admin-bg-surface p-8">
        <p className="mb-8 text-center text-lg font-bold uppercase tracking-[0.2em] text-admin-text-primary">
          QOR Admin
        </p>

        <h1 className="text-2xl font-semibold text-admin-text-primary">Entrar</h1>
        <p className="mt-1 mb-6 text-sm text-admin-text-secondary">
          Acesse o painel administrativo da QOR.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {serverError ? (
            <p role="alert" className="text-sm text-admin-danger">
              {serverError}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-admin-text-secondary">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={INPUT_CLASS}
              value={state.email}
              onChange={handleChange("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" role="alert" className="text-sm text-admin-danger">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-admin-text-secondary">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className={INPUT_CLASS}
              value={state.password}
              onChange={handleChange("password")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password ? (
              <p id="password-error" role="alert" className="text-sm text-admin-danger">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* "Manter conectado" has no backend effect yet — LoginRequest
                  takes no such option — so this checkbox is purely inert. */}
              <input id="remember" type="checkbox" className={CHECKBOX_CLASS} />
              <label htmlFor="remember" className="text-sm text-admin-text-secondary">
                Manter conectado
              </label>
            </div>
            <a href="#" className="text-sm text-admin-primary">
              Esqueci minha senha
            </a>
          </div>

          <Button
            type="submit"
            color="primary"
            variant="pill"
            disabled={isSubmitting}
            className="mt-2 w-full uppercase disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
