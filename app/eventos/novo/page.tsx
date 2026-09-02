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
 *
 * AT31 — at-limit banner (MON-08, MON-18): useOrganizerSubscription()'s
 * is_at_limit blocks the form up front, same as the pending-approval gate.
 * Quota can also be exceeded in the race between this page loading and the
 * user submitting (another event published in the meantime) — that case is
 * caught in handleSubmit via ApiError.code === "quota_exceeded".
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, type EventFormDraft } from "../../../components/design-system/EventForm";
import { OrganizerBlockedNotice } from "../../../components/design-system/OrganizerBlockedNotice";
import { QuotaUsageWidget } from "../../../components/design-system/QuotaUsageWidget";
import { useSession } from "../../../hooks/useSession";
import { useEvents } from "../../../hooks/useOrganizerEvents";
import { useOrganizerSubscription } from "../../../hooks/useBilling";
import { isOrganizerBlocked } from "../../../lib/organizer-approval";
import { ApiError } from "../../../lib/api/http";

const UPGRADE_HREF = "/assinatura";

export default function NewEventPage() {
  const router = useRouter();
  const { account, venue, promoter, loading: sessionLoading, error: sessionError } = useSession();
  const { usage, loading: usageLoading } = useOrganizerSubscription();
  const { create } = useEvents();
  const [formError, setFormError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  async function handleSubmit(values: EventFormDraft) {
    setFormError(null);
    setQuotaExceeded(false);
    try {
      await create(values);
      router.push("/eventos");
    } catch (err) {
      if (err instanceof ApiError && err.code === "quota_exceeded") {
        setQuotaExceeded(true);
        return;
      }
      setFormError("Erro ao criar o evento.");
    }
  }

  if (sessionLoading || usageLoading) {
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

  if (usage?.is_at_limit || quotaExceeded) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold text-admin-text-primary">Novo Evento</h1>
        {usage && <QuotaUsageWidget usage={{ ...usage, is_at_limit: true }} upgradeHref={UPGRADE_HREF} />}
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
