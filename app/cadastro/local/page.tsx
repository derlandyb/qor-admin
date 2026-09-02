"use client";

/**
 * AT18 — venue self-registration page (ADMIN-01–04): a Venue signs itself up
 * and lands in `Pending Approval`, not an active dashboard, so success is a
 * simple in-place confirmation rather than a redirect.
 *
 * ConsentCapture vs. RegistrationForm's own `terms_accepted` checkbox:
 * RegistrationForm's doc comment is explicit that its internal checkbox is a
 * plain "Aceito os termos de uso" control, and that the richer, shared
 * ConsentCapture contract (mobile.md A5 / website.md W10 — pt-BR terms +
 * privacy copy, policy version, never pre-checked) is deliberately a
 * page-level concern. Both ultimately gate the same underlying
 * `terms_accepted` field, so showing both checkboxes at once would read as
 * asking the venue to accept the same terms twice. Since RegistrationForm
 * can't be modified to drop its own checkbox, this page reconciles the two
 * with progressive disclosure: ConsentCapture is rendered first as the
 * authoritative, page-level consent gate, and RegistrationForm (with its own
 * simpler checkbox) only mounts once the venue has checked it. In practice a
 * venue accepts once via ConsentCapture, then confirms via the form's own
 * checkbox as part of filling it in — no simultaneous duplicate prompt.
 */
import { useState } from "react";
import { ConsentCapture } from "../../../components/design-system/ConsentCapture";
import { RegistrationForm } from "../../../components/design-system/RegistrationForm";
import type { VenueRegistrationDraft } from "../../../components/design-system/form-validation";
import { useVenueRegistration } from "../../../hooks/useRegistration";

const POLICY_VERSION = "1.0";

export default function VenueSelfRegistrationPage() {
  const { register, error } = useVenueRegistration();
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  function handleConsentChange(checked: boolean) {
    setConsentChecked(checked);
    if (checked) setConsentError(undefined);
  }

  async function handleSubmit(values: VenueRegistrationDraft) {
    if (!consentChecked) {
      setConsentError("É necessário aceitar os termos de uso e a política de privacidade.");
      return;
    }
    try {
      await register({ ...values, terms_accepted: true });
      setSubmitted(true);
    } catch {
      // useVenueRegistration() already captured the failure in `error`,
      // rendered below as a page-level banner.
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-admin-bg-body px-4 py-10">
      <div className="w-full max-w-[560px] rounded-admin-default border border-white/10 bg-admin-bg-surface p-8">
        <h1 className="text-2xl font-semibold text-admin-text-primary">
          Cadastro de local
        </h1>
        <p className="mt-1 text-sm text-admin-text-secondary">
          Cadastre seu local (casa de shows, bar, clube) para divulgar eventos no QOR. Após o
          envio, seu cadastro fica em análise até ser aprovado pela nossa equipe.
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
                <RegistrationForm type="venue" onSubmit={handleSubmit} />
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
