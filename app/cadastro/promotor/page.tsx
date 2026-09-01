"use client";

/**
 * AT19 — promoter self-registration page (ADMIN-05–06): a Promoter signs
 * itself up and lands in `Pending Approval`, not an active dashboard, so
 * success is a simple in-place confirmation rather than a redirect.
 *
 * Mirrors app/cadastro/local/page.tsx's ConsentCapture vs. RegistrationForm
 * reconciliation exactly, for consistency across the two registration pages:
 * ConsentCapture is rendered first as the authoritative, page-level consent
 * gate, and RegistrationForm (with its own simpler checkbox) only mounts once
 * the promoter has checked it — see that file's doc comment for the full
 * rationale.
 */
import { useState } from "react";
import { ConsentCapture } from "../../../components/design-system/ConsentCapture";
import { RegistrationForm } from "../../../components/design-system/RegistrationForm";
import type { PromoterRegistrationDraft } from "../../../components/design-system/form-validation";
import { usePromoterRegistration } from "../../../hooks/useRegistration";

const POLICY_VERSION = "1.0";

export default function PromoterSelfRegistrationPage() {
  const { register, error } = usePromoterRegistration();
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  function handleConsentChange(checked: boolean) {
    setConsentChecked(checked);
    if (checked) setConsentError(undefined);
  }

  async function handleSubmit(values: PromoterRegistrationDraft) {
    if (!consentChecked) {
      setConsentError("É necessário aceitar os termos de uso e a política de privacidade.");
      return;
    }
    try {
      await register({ ...values, terms_accepted: true });
      setSubmitted(true);
    } catch {
      // usePromoterRegistration() already captured the failure in `error`,
      // rendered below as a page-level banner.
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-admin-bg-body px-4 py-10">
      <div className="w-full max-w-[560px] rounded-admin-default border border-white/10 bg-admin-bg-surface p-8">
        <h1 className="text-2xl font-semibold text-admin-text-primary">
          Cadastro de promotor
        </h1>
        <p className="mt-1 text-sm text-admin-text-secondary">
          Cadastre-se como promotor para divulgar eventos no QOR. Após o envio, seu cadastro
          fica em análise até ser aprovado pela nossa equipe.
        </p>

        {submitted ? (
          <p role="status" className="mt-6 rounded-admin-default bg-admin-primary/15 px-3 py-2 text-sm text-admin-text-primary">
            Cadastro enviado! Sua conta está em análise.
          </p>
        ) : (
          <>
            {error && (
              <p role="alert" className="mt-6 rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
                {error}
              </p>
            )}

            <div className="mt-6">
              <ConsentCapture
                policyVersion={POLICY_VERSION}
                checked={consentChecked}
                onChange={handleConsentChange}
                error={consentError}
              />
            </div>

            {consentChecked ? (
              <div className="mt-6">
                <RegistrationForm type="promoter" onSubmit={handleSubmit} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-admin-text-secondary">
                Aceite os termos de uso e a política de privacidade para continuar o cadastro.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
