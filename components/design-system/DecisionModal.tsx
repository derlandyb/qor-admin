"use client";

import { useState } from "react";
import { Button } from "./Button";

export interface DecisionModalProps {
  open: boolean;
  title: string;
  description?: string;
  /** ADMIN-09/ADMIN-18 — the reason/feedback field is always optional, never required. */
  reasonLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (reason: string | null) => void;
  onCancel: () => void;
}

/**
 * design-system-admin.md §5.9 — content radius matches the uniform 6px
 * token; the open/close transition could not be measured live on the
 * Corona Tailwind demo (§5.9's own caveat) and every other component in
 * this design system snaps instantly rather than fades (§4), so this modal
 * snaps open/closed too rather than guessing a fade duration from the
 * superseded "Corona React" doc. Footer-right primary/light button pair.
 */
export function DecisionModal({
  open,
  title,
  description,
  reasonLabel = "Motivo (opcional)",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: DecisionModalProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
        className="w-full max-w-md rounded-admin-default bg-admin-bg-surface p-6"
      >
        <h2 id="decision-modal-title" className="text-lg font-bold text-admin-text-primary">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-admin-text-secondary">{description}</p>}

        <div className="mt-4 flex flex-col gap-1">
          <label htmlFor="decision-modal-reason" className="text-sm text-admin-text-secondary">
            {reasonLabel}
          </label>
          <textarea
            id="decision-modal-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-admin-input-select border border-white/10 bg-admin-bg-body px-3 py-2 text-sm text-admin-text-primary focus:outline-none focus:border-admin-primary"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="inverse" color="light" onClick={onCancel} type="button">
            {cancelLabel}
          </Button>
          <Button
            variant="default"
            color="primary"
            type="button"
            onClick={() => onConfirm(reason.trim() === "" ? null : reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
