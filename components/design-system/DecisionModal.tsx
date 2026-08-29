"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./Button";

/**
 * Shared approve/reject decision modal (design-system-admin.md §5.9) used
 * by BOTH account approvals (ADMIN-09/ADMIN-10) and event approvals
 * (ADMIN-18/ADMIN-19).
 *
 * Backdrop: black 50% opacity, 150ms linear fade
 * (`duration-admin-modal-fade`/`ease-admin-modal-fade`).
 * Dialog: `transform` slide-in, 400ms ease
 * (`duration-admin-modal`/`ease-admin-modal`).
 * Content: `rounded-admin-modal`, `bg-admin-bg-surface-alt` (near-black,
 * deliberately darker than the `#191C24` card default).
 *
 * The optional reason/feedback field is never required to submit — both
 * flows treat it as "optional, not required" per admin.md — `onConfirm` is
 * called with `undefined` when the field is left blank.
 */

export interface DecisionModalProps {
  open: boolean;
  title: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showReasonField?: boolean;
  reasonLabel?: string;
  isSubmitting?: boolean;
}

export function DecisionModal(props: DecisionModalProps) {
  // Rendering `null` unmounts `DecisionModalContent` entirely, so it gets a
  // fresh mount (and fresh "not yet visible" state) every time the modal
  // opens again — no need to reset transition state on close.
  if (!props.open) {
    return null;
  }

  return <DecisionModalContent {...props} />;
}

function DecisionModalContent({
  title,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  showReasonField = true,
  reasonLabel = "Motivo (opcional)",
  isSubmitting = false,
}: Omit<DecisionModalProps, "open">) {
  const [reason, setReason] = useState("");
  // Starts false so the backdrop/dialog mount at their "hidden" state, then
  // flips true on the next frame so the opacity/transform transitions
  // actually animate rather than snapping straight to visible.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reason.trim();
    onConfirm(trimmed ? trimmed : undefined);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-admin-modal-fade ease-admin-modal-fade ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
        className={`w-full max-w-md rounded-admin-modal bg-admin-bg-surface-alt p-6 shadow-lg transition-transform duration-admin-modal ease-admin-modal ${
          visible ? "translate-y-0" : "-translate-y-4"
        }`}
      >
        <h2 id="decision-modal-title" className="text-admin-h5 font-medium text-admin-text-primary">
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {showReasonField ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="decision_reason"
                className="text-sm font-medium text-admin-text-secondary"
              >
                {reasonLabel}
              </label>
              <textarea
                id="decision_reason"
                className="w-full bg-admin-bg-surface border border-admin-border-subtle rounded-admin-input px-5 pt-[13px] pb-[11px] text-sm text-admin-text-primary placeholder:text-admin-text-secondary transition-[border-color,box-shadow] duration-admin-control ease-admin-control focus:outline-none focus:border-admin-primary focus:shadow-[0_0_0_2px_rgba(0,144,231,0.25)]"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              color="light"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" color="primary" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
