"use client";

export interface ConsentCaptureProps {
  policyVersion: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  termsUrl?: string;
  error?: string;
}

/**
 * Shared consent-capture contract with mobile.md's A5 / website.md's W10:
 * pt-BR terms/privacy display with a required, non-pre-checked acceptance
 * checkbox. Independent Corona-styled implementation for qor-admin — the
 * checkbox is never checked by default regardless of what the caller passes
 * on first render (enforced by the parent owning `checked` as state that
 * starts `false`, not by this component defaulting anything).
 */
export function ConsentCapture({
  policyVersion,
  checked,
  onChange,
  termsUrl,
  error,
}: ConsentCaptureProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 text-sm text-admin-text-secondary">
        <input
          type="checkbox"
          checked={checked}
          required
          aria-required="true"
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded-admin-input-select border border-white/10 bg-admin-bg-surface"
        />
        <span>
          Li e aceito os{" "}
          {termsUrl ? (
            <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-admin-primary">
              termos de uso e a política de privacidade
            </a>
          ) : (
            "termos de uso e a política de privacidade"
          )}{" "}
          (versão {policyVersion}).
        </span>
      </label>
      {error && (
        <p role="alert" className="text-xs text-admin-danger">
          {error}
        </p>
      )}
    </div>
  );
}
