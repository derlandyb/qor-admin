"use client";

/**
 * Admin login page — design-system-admin.md §5.11 (centered auth card,
 * max-width ~420px, on the pure-black bg-admin-bg-body body). No
 * social-login button: admin/venue/promoter accounts are email/password
 * only (ARCHITECTURE §2). Password recovery is an unresolved product gap
 * (.specs/project/STATE.md) — the "esqueci minha senha" link is a dead
 * placeholder for now.
 */
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/design-system/Button";
import { TextField } from "../../components/design-system/Field";
import { login } from "../../lib/api/client";
import { ApiError } from "../../lib/api/http";
import { useSession } from "../../hooks/useSession";

export default function LoginPage() {
  const router = useRouter();
  const { account, loading: sessionLoading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (account) {
    router.push("/dashboard");
    return null;
  }

  if (sessionLoading) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          setFieldErrors(err.errors);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Erro inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-admin-bg-body px-4">
      <div className="w-full max-w-[420px] rounded-admin-default border border-white/10 bg-admin-bg-surface p-8">
        <h1 className="text-center text-2xl font-semibold text-admin-text-primary">
          QOR Admin
        </h1>
        <p className="mt-1 text-center text-sm text-admin-text-secondary">
          Entre com suas credenciais para acessar o painel.
        </p>

        {formError && (
          <p role="alert" className="mt-6 rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
            {formError}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email?.[0]}
          />
          <TextField
            id="password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password?.[0]}
          />

          <div className="flex items-center justify-between text-sm">
            <label htmlFor="remember-me" className="flex items-center gap-2 text-admin-text-secondary">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Manter conectado
            </label>
            <a href="#" className="text-admin-primary hover:underline">
              Esqueci minha senha
            </a>
          </div>

          <Button
            type="submit"
            variant="default"
            color="primary"
            className="w-full uppercase"
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
