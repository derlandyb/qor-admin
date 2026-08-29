"use client";

import { useState } from "react";

import { DataTable, type Column } from "@/components/design-system/DataTable";
import { DecisionModal } from "@/components/design-system/DecisionModal";
import { StatusPill } from "@/components/design-system/StatusPill";
import { Button } from "@/components/design-system/Button";
import { useEventApprovalQueue } from "@/hooks/useApprovalQueues";
import { ApprovalOutcome, City, CityLabel, EventStatus } from "@/lib/enums";
import type { QorEvent } from "@/lib/api/types";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatStartsAt(startsAt: string): string {
  return DATE_TIME_FORMATTER.format(new Date(startsAt));
}

function isPastDue(event: QorEvent): boolean {
  return event.status === EventStatus.PendingReview && new Date(event.starts_at) < new Date();
}

interface PendingDecision {
  event: QorEvent;
  outcome: ApprovalOutcome;
}

/**
 * ADMIN-16–ADMIN-19: lists every Pending Review event and lets an admin
 * approve (-> Published) or reject (-> Draft, with optional feedback) it.
 * The past-date edge case (starts_at already passed while still
 * pending_review server-side) is flagged client-side per admin.md — the
 * enum value itself never lies.
 */
export default function EventoApprovalsPage() {
  const { events, isLoading, error, decide } = useEventApprovalQueue();
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openDecision(event: QorEvent, outcome: ApprovalOutcome) {
    setPendingDecision({ event, outcome });
  }

  function closeDecision() {
    setPendingDecision(null);
  }

  async function handleConfirm(feedback?: string) {
    if (!pendingDecision) return;
    setIsSubmitting(true);
    try {
      await decide(pendingDecision.event.id, pendingDecision.outcome, feedback);
      setPendingDecision(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: Column<QorEvent>[] = [
    {
      header: "Título",
      render: (event) => event.title,
    },
    {
      header: "Cidade",
      render: (event) => CityLabel[event.city as City] ?? event.city,
    },
    {
      header: "Data/Hora",
      render: (event) => formatStartsAt(event.starts_at),
    },
    {
      header: "Preço",
      render: (event) => (event.is_free ? "Gratuito" : "Pago"),
    },
    {
      header: "Status",
      render: (event) => (
        <span className="flex items-center gap-2">
          <StatusPill status={event.status} />
          {isPastDue(event) ? (
            <span className="text-admin-text-secondary text-xs">(data já passou)</span>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Aprovação de Eventos</h1>

      {isLoading ? (
        <p className="text-admin-text-secondary">Carregando...</p>
      ) : error ? (
        <p className="text-admin-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={events}
          rowKey={(event) => event.id}
          actions={(event) => (
            <div className="flex gap-2">
              <Button
                type="button"
                color="success"
                onClick={() => openDecision(event, ApprovalOutcome.Approved)}
              >
                Aprovar
              </Button>
              <Button
                type="button"
                color="danger"
                onClick={() => openDecision(event, ApprovalOutcome.Rejected)}
              >
                Rejeitar
              </Button>
            </div>
          )}
        />
      )}

      <DecisionModal
        open={pendingDecision !== null}
        title={
          pendingDecision?.outcome === ApprovalOutcome.Approved
            ? "Aprovar evento"
            : "Rejeitar evento"
        }
        onConfirm={handleConfirm}
        onCancel={closeDecision}
        confirmLabel={pendingDecision?.outcome === ApprovalOutcome.Approved ? "Aprovar" : "Rejeitar"}
        reasonLabel="Feedback (opcional)"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
