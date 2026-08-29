"use client";

/**
 * LGPD Art. 7 consent-capture control (ADMIN-02/ADMIN-06 — Venue/Promoter
 * self-registration must capture explicit, non-pre-checked consent to the
 * terms of use). Reusable so every registration flow captures consent the
 * same way instead of hand-rolling its own checkbox.
 *
 * NOTE: `RegistrationForm.tsx`'s current inline `terms_accepted` checkbox
 * predates this component and is a candidate for a follow-up refactor to
 * use it — intentionally NOT refactored here (out of scope for this task,
 * and that file already has its own tested behaviour).
 *
 * NOTE: the terms link below points to `#` as a placeholder — no terms
 * page exists yet. Wire it up to the real route once one is published.
 */

const CHECKBOX_CLASS =
  "h-4 w-4 rounded-admin-checkbox border border-admin-border-subtle bg-white text-admin-primary";

export interface ConsentCaptureProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  policyVersion?: string;
  error?: string;
}

export function ConsentCapture({
  checked,
  onChange,
  policyVersion,
  error,
}: ConsentCaptureProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          id="consent_capture"
          type="checkbox"
          className={CHECKBOX_CLASS}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "consent_capture-error" : undefined}
        />
        <label htmlFor="consent_capture" className="text-sm text-admin-text-secondary">
          Aceito os{" "}
          <a href="#" className="text-admin-primary underline">
            termos de uso
          </a>
          {policyVersion ? (
            <span className="text-admin-text-muted"> ({policyVersion})</span>
          ) : null}
        </label>
      </div>
      {error ? (
        <p id="consent_capture-error" role="alert" className="text-sm text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
