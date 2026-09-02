"use client";

/**
 * AT20 — organizer event create page (ADMIN-11, ADMIN-20–ADMIN-22). Same
 * pending-approval-blocked gate as app/eventos/page.tsx (ADMIN-03), via the
 * shared isOrganizerBlocked() helper.
 *
 * The actual payoff of this session's earlier qor-api detour (GET
 * /api/admin/v1/me + /venues/me + /promoters/me, wrapped by useSession()):
 * a venue_admin's new event defaults to that venue's own address/city
 * (still editable — EventForm.address is a plain field), since a venue has
 * one fixed address; a promoter's new event has no address default at all,
 * since a promoter picks a location manually per event.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, type EventFormDraft } from "../../../components/design-system/EventForm";
import { OrganizerBlockedNotice } from "../../../components/design-system/OrganizerBlockedNotice";
import { useSession } from "../../../hooks/useSession";
import { useEvents } from "../../../hooks/useOrganizerEvents";
import { isOrganizerBlocked } from "../../../lib/organizer-approval";

export default function NewEventPage() {
  const router = useRouter();
  const { account, venue, promoter, loading: sessionLoading, error: sessionError } = useSession();
  const { create } = useEvents();
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: EventFormDraft) {
    setFormError(null);
    try {
      await create(values);
      router.push("/eventos");
    } catch {
      setFormError("Erro ao criar o evento.");
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      </div>
    );
  }

  if (isOrganizerBlocked(account, venue, promoter)) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold text-admin-text-primary">Novo Evento</h1>
        <OrganizerBlockedNotice />
      </div>
    );
  }

  const initialValues: Partial<EventFormDraft> | undefined =
    account?.account_type === "venue_admin" && venue
      ? { address: venue.address, city: venue.city }
      : undefined;

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Novo Evento</h1>

      {sessionError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {sessionError}
        </p>
      )}
      {formError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {formError}
        </p>
      )}

      <EventForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Criar Evento" />
    </div>
  );
}
