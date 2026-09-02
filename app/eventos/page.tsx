"use client";

/**
 * AT20 — organizer event list (ADMIN-11–ADMIN-15, ADMIN-20–ADMIN-22).
 * Pending-approval-blocked state (ADMIN-03): an organizer whose own
 * account isn't yet `approved` sees OrganizerBlockedNotice instead of the
 * list/create UI, so a pending organizer can never reach event creation.
 *
 * Row actions per Event.status:
 * - draft: "Enviar para revisão" (submit()) + an edit link.
 * - pending_review: just an edit link — still editable per ADMIN-12, no
 *   submit needed (it's already under review).
 * - published/cancelled/ended: a duplicate action (only useful for
 *   published/ended — offering it there lets an organizer reuse a past
 *   event's details for a new date) and cancel (only offered while
 *   published, since cancelling an already-cancelled/ended event is a
 *   no-op).
 *
 * Duplicate startsAt: kept simple per the task's own guidance (no
 * date-picker built here) — defaults to the original event's `starts_at`
 * and immediately redirects to the new duplicate's edit page so the
 * organizer adjusts the date there, rather than prompting inline.
 *
 * AT31 — publish-quota at-limit banner (MON-08, MON-18): qor-api's
 * CheckAndIncrementQuota only runs inside SubmitEventForReview
 * (EventController::submit(), POST /events/{id}/submit) — creating or
 * editing an event is never quota-gated — so "Enviar para revisão" below
 * is the one place a quota_exceeded (422) response can actually happen,
 * and the only place this banner belongs. No upgradeHref is passed to
 * QuotaUsageWidget yet — qor-landingpage's plan-comparison page (the
 * intended cross-repo target, per admin.md's AT31 task text) isn't
 * scaffolded yet; /assinatura can't be it either, since it's display-only
 * (no change-plan action) until Monetization P2 lands.
 */
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "../../components/design-system/DataTable";
import { StatusPill } from "../../components/design-system/StatusPill";
import { Button } from "../../components/design-system/Button";
import { OrganizerBlockedNotice } from "../../components/design-system/OrganizerBlockedNotice";
import { QuotaUsageWidget } from "../../components/design-system/QuotaUsageWidget";
import { useSession } from "../../hooks/useSession";
import { useEvents } from "../../hooks/useOrganizerEvents";
import { useOrganizerSubscription } from "../../hooks/useBilling";
import { isOrganizerBlocked } from "../../lib/organizer-approval";
import { ApiError } from "../../lib/api/http";
import type { Event } from "../../lib/api/types";

function formatStartsAt(startsAt: string): string {
  return new Date(startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function EventsPage() {
  const router = useRouter();
  const { account, venue, promoter, loading: sessionLoading, error: sessionError } = useSession();
  const { events, loading: eventsLoading, error: eventsError, submit, duplicate, cancel } =
    useEvents();
  const { usage, refetch: refetchUsage } = useOrganizerSubscription();
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  async function handleDuplicate(event: Event) {
    const created = await duplicate(event.id, event.starts_at);
    router.push(`/eventos/${created.id}/editar`);
  }

  async function handleSubmitForReview(id: number) {
    try {
      await submit(id);
    } catch (err) {
      if (err instanceof ApiError && err.code === "quota_exceeded") {
        setQuotaExceeded(true);
        await refetchUsage();
        return;
      }
      throw err;
    }
  }

  const atLimit = usage?.is_at_limit || quotaExceeded;

  function renderActions(event: Event) {
    return (
      <div className="flex flex-wrap gap-2">
        {event.status === "draft" && (
          <button
            type="button"
            onClick={() => void handleSubmitForReview(event.id)}
            className="rounded-admin-default px-2 py-1 text-xs font-medium text-admin-primary hover:bg-white/5"
          >
            Enviar para revisão
          </button>
        )}
        {(event.status === "draft" || event.status === "pending_review") && (
          <Link
            href={`/eventos/${event.id}/editar`}
            className="rounded-admin-default px-2 py-1 text-xs font-medium text-admin-primary hover:bg-white/5"
          >
            Editar
          </Link>
        )}
        {(event.status === "published" || event.status === "ended") && (
          <button
            type="button"
            onClick={() => void handleDuplicate(event)}
            className="rounded-admin-default px-2 py-1 text-xs font-medium text-admin-primary hover:bg-white/5"
          >
            Duplicar
          </button>
        )}
        {event.status === "published" && (
          <button
            type="button"
            onClick={() => void cancel(event.id)}
            className="rounded-admin-default px-2 py-1 text-xs font-medium text-admin-danger hover:bg-white/5"
          >
            Cancelar
          </button>
        )}
      </div>
    );
  }

  const columns: DataTableColumn<Event>[] = [
    { key: "title", header: "Título", render: (row) => row.title },
    { key: "starts_at", header: "Data", render: (row) => formatStartsAt(row.starts_at) },
    { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> },
    { key: "actions", header: "Ações", render: renderActions },
  ];

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
        <h1 className="text-2xl font-semibold text-admin-text-primary">Meus Eventos</h1>
        <OrganizerBlockedNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-admin-text-primary">Meus Eventos</h1>
        <Link href="/eventos/novo">
          <Button>+ Novo Evento</Button>
        </Link>
      </div>

      {sessionError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {sessionError}
        </p>
      )}
      {eventsError && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {eventsError}
        </p>
      )}
      {atLimit && usage && (
        <QuotaUsageWidget usage={{ ...usage, is_at_limit: true }} />
      )}

      {eventsLoading ? (
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      ) : (
        <DataTable columns={columns} rows={events} rowKey={(row) => row.id} />
      )}
    </div>
  );
}
