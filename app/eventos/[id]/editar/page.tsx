"use client";

/**
 * AT20 — organizer event edit page (ADMIN-12–ADMIN-15), the app's first
 * dynamic route. Next.js 16 App Router: `params` is now a Promise. The
 * canonical unwrap is `use(params)` inside a Suspense boundary, but that
 * combination doesn't reliably re-render under React Testing Library/jsdom
 * in this project's Vitest setup (verified with a minimal repro: the
 * post-suspend re-render never commits without an explicit `act()` the
 * page itself has no reason to require) — so `params` is resolved with a
 * plain `useEffect`/`useState` instead, which behaves identically for a
 * route param (resolves on the same tick either way) and is deterministic
 * under RTL's `findBy*`/`waitFor` polling.
 *
 * No single-event GET endpoint exists (lib/api/client.ts only has
 * listEvents() for organizers) — the event to edit is found in
 * useEvents().events by id, which already only contains the organizer's own
 * events. No venue-address defaulting here: this is editing an existing
 * event, not creating one, so EventForm's initialValues come straight from
 * the found event's own fields.
 *
 * AT31 — same at-limit gate as app/eventos/novo/page.tsx (MON-08, MON-18),
 * see that file's docblock.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, type EventFormDraft } from "../../../../components/design-system/EventForm";
import { QuotaUsageWidget } from "../../../../components/design-system/QuotaUsageWidget";
import { useEvents } from "../../../../hooks/useOrganizerEvents";
import { useOrganizerSubscription } from "../../../../hooks/useBilling";
import { ApiError } from "../../../../lib/api/http";

const UPGRADE_HREF = "/assinatura";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <p className="text-sm text-admin-text-secondary">Carregando...</p>
    </div>
  );
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const router = useRouter();
  const { events, loading: eventsLoading, error, edit } = useEvents();
  const { usage, loading: usageLoading } = useOrganizerSubscription();
  const [id, setId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    let active = true;
    params.then((resolved) => {
      if (active) setId(resolved.id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  const event = id === null ? undefined : events.find((e) => String(e.id) === id);

  async function handleSubmit(values: EventFormDraft) {
    if (id === null) return;
    setFormError(null);
    setQuotaExceeded(false);
    try {
      await edit(Number(id), values);
      router.push("/eventos");
    } catch (err) {
      if (err instanceof ApiError && err.code === "quota_exceeded") {
        setQuotaExceeded(true);
        return;
      }
      setFormError("Erro ao salvar o evento.");
    }
  }

  if (id === null || eventsLoading || usageLoading) {
    return <LoadingState />;
  }

  if (usage?.is_at_limit || quotaExceeded) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold text-admin-text-primary">Editar Evento</h1>
        {usage && <QuotaUsageWidget usage={{ ...usage, is_at_limit: true }} upgradeHref={UPGRADE_HREF} />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-sm text-admin-text-secondary">Evento não encontrado.</p>
      </div>
    );
  }

  const initialValues: Partial<EventFormDraft> = {
    title: event.title,
    description: event.description,
    starts_at: event.starts_at,
    city: event.city,
    genre_id: event.genre_id,
    is_free: event.is_free,
    address: event.address ?? "",
    ticket_url: event.ticket_url ?? "",
    capacity: event.capacity,
    age_rating: event.age_rating ?? "",
    notes: event.notes ?? "",
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Editar Evento</h1>
      {formError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {formError}
        </p>
      )}
      <EventForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Salvar Alterações" />
    </div>
  );
}
