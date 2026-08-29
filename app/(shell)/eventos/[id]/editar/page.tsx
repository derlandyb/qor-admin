"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { EventForm } from "@/components/design-system/EventForm";
import { QuotaUsageWidget } from "@/components/design-system/QuotaUsageWidget";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { useOrganizerSubscription } from "@/hooks/useBilling";
import type { CreateEventPayload, EditEventPayload } from "@/lib/api/types";

// Placeholder until qor-landingpage ships its plan-comparison page.
const UPGRADE_PLAN_URL = "https://qor.app/planos";

/**
 * ADMIN-21/ADMIN-03: `useOrganizerEvents` fetches the organizer's own
 * events on mount, so this page waits for that list to populate before it
 * can find the event matching the route's `id` — hence the loading and
 * not-found guards below. Once found, edits go through `update`, whose
 * ApiError.message (e.g. an unapproved-account policy rejection) is
 * surfaced via EventForm's serverError, same as the create page.
 *
 * AT31: quota is only actually checked by `SubmitEventForReview` when the
 * organizer clicks "Enviar para revisão" on /eventos — editing an
 * existing Draft doesn't consume a quota slot — so this page only shows
 * an informational at-limit banner rather than blocking the form.
 */
export default function EditarEventoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { events, isLoading, update, error } = useOrganizerEvents();
  const { usage } = useOrganizerSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventId = Number(params.id);
  const event = events.find((candidate) => candidate.id === eventId);

  async function handleEdit(payload: CreateEventPayload | EditEventPayload) {
    setIsSubmitting(true);
    try {
      const updated = await update(eventId, payload as EditEventPayload);
      if (updated) {
        router.push("/eventos");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-admin-text-secondary">Carregando...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p role="alert" className="text-admin-danger">
          Evento não encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Editar Evento</h1>

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

      <EventForm
        mode="edit"
        initialValues={event}
        onSubmit={handleEdit}
        isSubmitting={isSubmitting}
        serverError={error}
      />
    </div>
  );
}
