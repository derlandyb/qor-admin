"use client";

import Link from "next/link";

import { Button } from "@/components/design-system/Button";
import { DataTable, type Column } from "@/components/design-system/DataTable";
import { StatusPill } from "@/components/design-system/StatusPill";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import type { QorEvent } from "@/lib/api/types";
import { City, CityLabel, EventStatus } from "@/lib/enums";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatStartsAt(startsAt: string): string {
  return DATE_TIME_FORMATTER.format(new Date(startsAt));
}

/**
 * ADMIN-11–ADMIN-15/ADMIN-20–ADMIN-22: the organizer's own events list —
 * create/edit/submit-for-review/duplicate/cancel actions. "Enviar para
 * revisão" only applies to a draft; "Cancelar" only to an event that is
 * currently live in some form (published or already under review).
 */
export default function EventosPage() {
  const { events, isLoading, error, submit, duplicate, cancel } = useOrganizerEvents();

  const columns: Column<QorEvent>[] = [
    { header: "Título", render: (event) => event.title },
    { header: "Data/Hora", render: (event) => formatStartsAt(event.starts_at) },
    { header: "Cidade", render: (event) => CityLabel[event.city as City] ?? event.city },
    { header: "Status", render: (event) => <StatusPill status={event.status} /> },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-admin-h3 font-medium text-admin-text-primary">Meus Eventos</h1>
        <Link href="/eventos/novo">
          <Button type="button" color="primary">
            + Novo Evento
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-admin-text-secondary">Carregando...</p>
      ) : error ? (
        <p role="alert" className="text-admin-danger">
          {error}
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={events}
          rowKey={(event) => event.id}
          actions={(event) => (
            <div className="flex flex-wrap gap-2">
              <Link href={`/eventos/${event.id}/editar`}>
                <Button type="button" color="secondary">
                  Editar
                </Button>
              </Link>
              {event.status === EventStatus.Draft ? (
                <Button type="button" color="info" onClick={() => submit(event.id)}>
                  Enviar para revisão
                </Button>
              ) : null}
              <Button type="button" color="light" onClick={() => duplicate(event.id)}>
                Duplicar
              </Button>
              {event.status === EventStatus.Published || event.status === EventStatus.PendingReview ? (
                <Button type="button" color="danger" onClick={() => cancel(event.id)}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          )}
        />
      )}
    </div>
  );
}
