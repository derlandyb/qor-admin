"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { EventForm } from "@/components/design-system/EventForm";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import type { CreateEventPayload, EditEventPayload } from "@/lib/api/types";

/**
 * ADMIN-21/ADMIN-03: `useOrganizerEvents` fetches the organizer's own
 * events on mount, so this page waits for that list to populate before it
 * can find the event matching the route's `id` — hence the loading and
 * not-found guards below. Once found, edits go through `update`, whose
 * ApiError.message (e.g. an unapproved-account policy rejection) is
 * surfaced via EventForm's serverError, same as the create page.
 */
export default function EditarEventoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { events, isLoading, update, error } = useOrganizerEvents();
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
