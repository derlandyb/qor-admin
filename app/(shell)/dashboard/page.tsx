"use client";

import { useEffect, useState } from "react";

import { DataTable, type Column } from "@/components/design-system/DataTable";
import { DonutWidget, type DonutSegment, type DonutSegmentColor } from "@/components/design-system/DonutWidget";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusPill } from "@/components/design-system/StatusPill";
import { apiClient, ApiError } from "@/lib/api/client";
import type { DashboardEvent } from "@/lib/api/types";
import { EventStatus } from "@/lib/enums";

const UNEXPECTED_ERROR_MESSAGE = "Ocorreu um erro inesperado.";
const NOT_AVAILABLE_LABEL = "—";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatStartsAt(startsAt: string): string {
  return DATE_TIME_FORMATTER.format(new Date(startsAt));
}

function formatCount(value: number | null): string {
  return value === null ? NOT_AVAILABLE_LABEL : String(value);
}

const STATUS_BREAKDOWN_CONFIG: { status: EventStatus; label: string; color: DonutSegmentColor }[] = [
  { status: EventStatus.Draft, label: "Rascunho", color: "warning" },
  { status: EventStatus.PendingReview, label: "Em análise", color: "info" },
  { status: EventStatus.Published, label: "Publicado", color: "success" },
  { status: EventStatus.Cancelled, label: "Cancelado", color: "danger" },
  { status: EventStatus.Ended, label: "Encerrado", color: "primary" },
];

/**
 * ADMIN-26/AT21: dashboard overview of the organizer's own events —
 * status-breakdown stat cards + donut, and a schedule/history table.
 * Per-event engagement counts (view/favorite/ticket-click/interested) are
 * always `null` from the API today (DashboardController::index hasn't been
 * wired to the Favorites & Social data yet), so they are rendered as "—"
 * rather than fabricated as 0. The quota-usage widget from
 * design-system-admin.md §5.10 is out of scope here — it depends on the
 * Monetization milestone's QuotaUsageWidget/useOrganizerSubscription,
 * which don't exist in this repo yet.
 */
export default function DashboardPage() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.dashboard.get();
        setEvents(response.data);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : UNEXPECTED_ERROR_MESSAGE;
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const totalEvents = events.length;
  const publishedCount = events.filter((event) => event.status === EventStatus.Published).length;
  const pendingCount = events.filter((event) => event.status === EventStatus.PendingReview).length;

  const statusSegments: DonutSegment[] = STATUS_BREAKDOWN_CONFIG.map(({ status, label, color }) => ({
    label,
    value: events.filter((event) => event.status === status).length,
    color,
  }));

  const columns: Column<DashboardEvent>[] = [
    {
      header: "Título",
      render: (event) => event.title,
    },
    {
      header: "Data/Hora",
      render: (event) => formatStartsAt(event.starts_at),
    },
    {
      header: "Status",
      render: (event) => <StatusPill status={event.status} />,
    },
    {
      header: "Visualizações",
      render: (event) => formatCount(event.view_count),
    },
    {
      header: "Favoritos",
      render: (event) => formatCount(event.favorite_count),
    },
    {
      header: "Cliques em ingresso",
      render: (event) => formatCount(event.ticket_click_count),
    },
    {
      header: "Interessados",
      render: (event) => formatCount(event.interested_count),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Dashboard</h1>

      {isLoading ? (
        <p className="text-admin-text-secondary">Carregando...</p>
      ) : error ? (
        <p className="text-admin-danger">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard value={totalEvents} label="Total de eventos" />
            <StatCard value={publishedCount} label="Eventos publicados" />
            <StatCard value={pendingCount} label="Eventos em análise" />
          </div>

          <DonutWidget total={totalEvents} segments={statusSegments} />

          <DataTable columns={columns} rows={events} rowKey={(event) => event.id} />
        </>
      )}
    </div>
  );
}
