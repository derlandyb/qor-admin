"use client";

/**
 * AT17 — Super Admin event-approval (publish) queue (ADMIN-16–ADMIN-19).
 * Lists every `pending_review` Event with the details submitted and lets a
 * Super Admin approve (→`published`)/reject (→`draft` + feedback), auditable
 * via the api's decide-approval endpoint (which persists an
 * ApprovalDecision row). ADMIN-19's past-date edge case: a pending event
 * whose `starts_at` has already elapsed is flagged inline rather than shown
 * as an ordinary pending item, since approving it would be pointless (the
 * date already passed and the api will surface it as `ended` once
 * published). Role-gating is useSession()/AT22's job (layout wiring), not
 * this page's — this page assumes it is only ever reached by an authorized
 * Super Admin.
 */
import { useState } from "react";
import { DataTable, type DataTableColumn } from "../../../components/design-system/DataTable";
import { DecisionModal } from "../../../components/design-system/DecisionModal";
import { useEventApprovalQueue } from "../../../hooks/useApprovalQueues";
import { CITY_LABELS } from "../../../lib/enums/city";
import type { Event } from "../../../lib/api/types";
import type { ApprovalOutcome } from "../../../lib/enums/approval";

interface PendingDecision {
  event: Event;
  outcome: ApprovalOutcome;
}

function formatStartsAt(startsAt: string): string {
  return new Date(startsAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function isPastDate(startsAt: string): boolean {
  return new Date(startsAt).getTime() < Date.now();
}

export default function EventApprovalsPage() {
  const { events, loading, error, page, totalPages, decide, setPage } = useEventApprovalQueue();
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const columns: DataTableColumn<Event>[] = [
    { key: "title", header: "Título", render: (row) => row.title },
    {
      key: "starts_at",
      header: "Data",
      render: (row) => (
        <span>
          {formatStartsAt(row.starts_at)}
          {isPastDate(row.starts_at) && (
            <span className="ml-2 text-xs text-admin-danger">(data já passou)</span>
          )}
        </span>
      ),
    },
    { key: "city", header: "Cidade", render: (row) => CITY_LABELS[row.city] },
    { key: "is_free", header: "Gratuito", render: (row) => (row.is_free ? "Sim" : "Não") },
  ];

  function requestDecision(event: Event, outcome: ApprovalOutcome) {
    setPendingDecision({ event, outcome });
  }

  async function handleConfirm(feedback: string | null) {
    if (!pendingDecision) return;
    const { event, outcome } = pendingDecision;
    setPendingDecision(null);
    await decide(event.id, { outcome, feedback });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-admin-text-primary">
          Aprovação de Eventos
        </h1>
        <p className="mt-1 text-sm text-admin-text-secondary">
          Analise os eventos pendentes de publicação.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={events}
            rowKey={(row) => row.id}
            actions={[
              { label: "Aprovar", onClick: (row) => requestDecision(row, "approved") },
              { label: "Rejeitar", onClick: (row) => requestDecision(row, "rejected") },
            ]}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-admin-default px-3 py-1 text-sm text-admin-text-secondary hover:bg-white/5 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-admin-text-secondary">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="rounded-admin-default px-3 py-1 text-sm text-admin-text-secondary hover:bg-white/5 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </>
      )}

      <DecisionModal
        open={pendingDecision !== null}
        title={
          pendingDecision?.outcome === "approved"
            ? `Aprovar ${pendingDecision.event.title}?`
            : `Rejeitar ${pendingDecision?.event.title ?? ""}?`
        }
        reasonLabel="Feedback (opcional)"
        onConfirm={handleConfirm}
        onCancel={() => setPendingDecision(null)}
      />
    </div>
  );
}
