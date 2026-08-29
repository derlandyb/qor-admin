"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EventForm } from "@/components/design-system/EventForm";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import type { CreateEventPayload, EditEventPayload } from "@/lib/api/types";

/**
 * ADMIN-20/ADMIN-03: creating an event while the organizer's own account
 * is still Pending Approval fails server-side with a policy error — the
 * hook never throws, it puts that ApiError.message (already pt-BR) into
 * `error`, which we pass straight through as EventForm's serverError so
 * it is shown clearly instead of being swallowed or replaced by a
 * generic fallback.
 */
export default function NovoEventoPage() {
  const router = useRouter();
  const { create, error } = useOrganizerEvents();
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
      <EventForm mode="create" onSubmit={handleCreate} isSubmitting={isSubmitting} serverError={error} />
    </div>
  );
}
