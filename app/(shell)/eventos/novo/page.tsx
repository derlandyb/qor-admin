"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EventForm } from "@/components/design-system/EventForm";
import { QuotaUsageWidget } from "@/components/design-system/QuotaUsageWidget";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { useOrganizerSubscription } from "@/hooks/useBilling";
import type { CreateEventPayload, EditEventPayload } from "@/lib/api/types";

// Placeholder until qor-landingpage ships its plan-comparison page.
const UPGRADE_PLAN_URL = "https://qor.app/planos";

/**
 * ADMIN-20/ADMIN-03: creating an event while the organizer's own account
 * is still Pending Approval fails server-side with a policy error — the
 * hook never throws, it puts that ApiError.message (already pt-BR) into
 * `error`, which we pass straight through as EventForm's serverError so
 * it is shown clearly instead of being swallowed or replaced by a
 * generic fallback.
 *
 * AT31: quota is only actually checked by `SubmitEventForReview` when the
 * organizer clicks "Enviar para revisão" on /eventos, not on Draft
 * creation here — so this page only shows an informational at-limit
 * banner (with an upgrade-plan link and the QuotaUsageWidget) rather than
 * blocking the form itself.
 */
export default function NovoEventoPage() {
  const router = useRouter();
  const { create, error } = useOrganizerEvents();
  const { usage } = useOrganizerSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(payload: CreateEventPayload | EditEventPayload) {
    setIsSubmitting(true);
    try {
      const created = await create(payload as CreateEventPayload);
      if (created) {
        router.push("/eventos");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Novo Evento</h1>

      {usage?.is_at_limit && (
        <div role="alert" className="flex flex-col gap-3 rounded-admin-card border border-admin-danger p-4">
          <p className="text-admin-body text-admin-danger">
            Você atingiu o limite de publicações do seu plano. Para publicar novos eventos, faça upgrade do seu
            plano.
          </p>
          <a
            href={UPGRADE_PLAN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-admin-body font-medium text-admin-primary underline"
          >
            Ver planos disponíveis
          </a>
          <QuotaUsageWidget usage={usage} />
        </div>
      )}

      <EventForm mode="create" onSubmit={handleCreate} isSubmitting={isSubmitting} serverError={error} />
    </div>
  );
}
