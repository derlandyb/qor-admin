"use client";

/**
 * AT21 — organizer dashboard overview (ADMIN-26).
 *
 * Two independent, unrelated fetches — the events/stats section and the
 * quota-usage widget draw from different endpoints and must not block each
 * other's loading/error states:
 *  - getDashboard() -> DashboardEvent[] for the stat cards, status donut,
 *    and event schedule/history table.
 *  - getSubscription() -> UsageSummary for the publish-quota progress bar.
 *
 * Per-event view/favorite/ticket-click/interested counts are `number | null`
 * and, per api.md T48's documented gap, currently always `null` server-side
 * (Favorites & Social has no per-event counting wired to the admin
 * dashboard yet). Rendered as "—" rather than coerced to 0, which would
 * misrepresent "no data" as "zero activity".
 */
import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "../../components/design-system/DataTable";
import { StatusPill } from "../../components/design-system/StatusPill";
import { StatCard } from "../../components/design-system/StatCard";
import { DonutWidget, type DonutSegment } from "../../components/design-system/DonutWidget";
import { ProgressBar } from "../../components/design-system/ProgressBar";
import { STATUS_LABEL } from "../../components/design-system/status";
import type { SemanticDataColor } from "../../components/design-system/colors";
import { getDashboard, getSubscription } from "../../lib/api/client";
import { ApiError } from "../../lib/api/http";
import { EVENT_STATUS_VALUES, type EventStatus } from "../../lib/enums/event-status";
import type { DashboardEvent, UsageSummary } from "../../lib/api/types";

/**
 * design-system-admin.md §5.4's 5-color semantic rotation applied to
 * EventStatus buckets. published->success (healthy/live), pending_review
 * ->warning (needs attention), cancelled->danger, draft->info (neutral,
 * not-yet-submitted), ended->primary (informational, no action needed).
 */
const STATUS_DONUT_COLOR: Record<EventStatus, SemanticDataColor> = {
  draft: "info",
  pending_review: "warning",
  published: "success",
  cancelled: "danger",
  ended: "primary",
};

type CountField = "view_count" | "favorite_count" | "ticket_click_count" | "interested_count";

/** Sums a count field across events, unless every event has `null` for it — then returns `null` (documented gap, not zero). */
function sumOrGap(events: DashboardEvent[], field: CountField): number | null {
  if (events.length === 0) return null;
  const values = events.map((event) => event[field]);
  if (values.every((value) => value === null)) return null;
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

function formatStartsAt(startsAt: string): string {
  return new Date(startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

interface StatDef {
  field: CountField;
  label: string;
}

const STAT_DEFS: StatDef[] = [
  { field: "view_count", label: "Visualizações" },
  { field: "favorite_count", label: "Favoritos" },
  { field: "ticket_click_count", label: "Cliques em ingresso" },
  { field: "interested_count", label: "Interessados" },
];

export default function DashboardPage() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((response) => setEvents(response.data))
      .catch((error: unknown) =>
        setEventsError(error instanceof ApiError ? error.message : "Erro inesperado."),
      )
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    getSubscription()
      .then((response) => setUsage(response.data))
      .catch((error: unknown) =>
        setUsageError(error instanceof ApiError ? error.message : "Erro inesperado."),
      )
      .finally(() => setUsageLoading(false));
  }, []);

  const statusCounts = EVENT_STATUS_VALUES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<EventStatus, number>,
  );
  for (const event of events) {
    statusCounts[event.status] += 1;
  }
  const segments: DonutSegment[] = EVENT_STATUS_VALUES.map((status) => ({
    label: STATUS_LABEL[status],
    value: statusCounts[status],
    color: STATUS_DONUT_COLOR[status],
  }));

  const columns: DataTableColumn<DashboardEvent>[] = [
    { key: "title", header: "Título", render: (row) => row.title },
    { key: "starts_at", header: "Data", render: (row) => formatStartsAt(row.starts_at) },
    { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> },
  ];

  const quotaPct =
    usage && usage.publish_quota !== null
      ? (usage.publishes_used_this_period / usage.publish_quota) * 100
      : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Painel</h1>

      {eventsError && (
        <p
          role="alert"
          className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger"
        >
          {eventsError}
        </p>
      )}
      {usageError && (
        <p
          role="alert"
          className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger"
        >
          {usageError}
        </p>
      )}

      {eventsLoading ? (
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STAT_DEFS.map(({ field, label }) => {
              const value = sumOrGap(events, field);
              return (
                <StatCard
                  key={field}
                  value={value === null ? "—" : value}
                  label={value === null ? `${label} (dados disponíveis em breve)` : label}
                />
              );
            })}
          </div>

          <DonutWidget title="Eventos por status" total={events.length} segments={segments} />

          <DataTable columns={columns} rows={events} rowKey={(row) => row.id} />
        </>
      )}

      <div className="rounded-admin-default bg-admin-bg-surface p-4">
        <h3 className="text-sm font-bold text-admin-text-primary">Uso do plano</h3>
        {usageLoading ? (
          <p className="mt-2 text-sm text-admin-text-secondary">Carregando...</p>
        ) : (
          usage && (
            <div className="mt-3">
              {quotaPct !== null ? (
                <ProgressBar
                  value={quotaPct}
                  variant="outer-label"
                  label={`${usage.publishes_used_this_period} de ${usage.publish_quota} publicações usadas este mês`}
                />
              ) : (
                <p className="text-sm text-admin-text-secondary">
                  Publicações ilimitadas neste plano.
                </p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
