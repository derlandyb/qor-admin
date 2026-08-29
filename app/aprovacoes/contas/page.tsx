"use client";

import { useState } from "react";

import { Button } from "@/components/design-system/Button";
import { DataTable, type Column } from "@/components/design-system/DataTable";
import { DecisionModal } from "@/components/design-system/DecisionModal";
import { useAccountApprovalQueue } from "@/hooks/useApprovalQueues";
import type { PendingAccount } from "@/lib/api/types";
import { ApprovalOutcome, CityLabel } from "@/lib/enums";

/**
 * pt-BR label for the two account kinds this queue ever contains
 * (ADMIN-07 — venue/promoter only, never "event" here even though
 * ApprovalDecidableType has a third case for the event queue).
 */
const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  venue: "Local",
  promoter: "Promotor",
};

interface PendingDecision {
  account: PendingAccount;
  outcome: ApprovalOutcome;
}

function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABEL[type] ?? type;
}

/**
 * Renders whichever of city/instagram/tiktok the row actually has
 * (design-system-admin.md §5.6 — DataTable never hardcodes domain
 * columns, callers decide per-row rendering).
 */
function accountDetails(account: PendingAccount): string {
  const parts: string[] = [];
  if (account.city) parts.push(CityLabel[account.city]);
  if (account.instagram) parts.push(`Instagram: ${account.instagram}`);
  if (account.tiktok) parts.push(`TikTok: ${account.tiktok}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

const COLUMNS: Column<PendingAccount>[] = [
  { header: "Tipo", render: (account) => accountTypeLabel(account.type) },
  { header: "Nome", render: (account) => account.name },
  { header: "E-mail", render: (account) => account.contact_email },
  { header: "Telefone", render: (account) => account.contact_phone },
  { header: "Detalhes", render: (account) => accountDetails(account) },
];

export default function AprovacaoDeContasPage() {
  const { accounts, isLoading, error, decide } = useAccountApprovalQueue();
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openDecision(account: PendingAccount, outcome: ApprovalOutcome) {
    setPendingDecision({ account, outcome });
  }

  function closeDecision() {
    setPendingDecision(null);
  }

  async function handleConfirm(reason?: string) {
    if (!pendingDecision) return;
    const { account, outcome } = pendingDecision;

    setIsSubmitting(true);
    try {
      await decide(account.type, account.id, outcome, reason);
      setPendingDecision(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-admin-h2 font-medium text-admin-text-primary">Aprovação de Contas</h1>

      {isLoading ? <p className="text-admin-text-secondary">Carregando...</p> : null}

      {error ? (
        <p role="alert" className="text-sm text-admin-danger">
          {error}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <DataTable<PendingAccount>
          columns={COLUMNS}
          rows={accounts}
          rowKey={(account) => `${account.type}-${account.id}`}
          actions={(account) => (
            <div className="flex gap-2">
              <Button
                type="button"
                color="success"
                onClick={() => openDecision(account, ApprovalOutcome.Approved)}
              >
                Aprovar
              </Button>
              <Button
                type="button"
                color="danger"
                onClick={() => openDecision(account, ApprovalOutcome.Rejected)}
              >
                Rejeitar
              </Button>
            </div>
          )}
        />
      ) : null}

      <DecisionModal
        open={pendingDecision !== null}
        title={
          pendingDecision?.outcome === ApprovalOutcome.Approved
            ? "Aprovar conta"
            : "Rejeitar conta"
        }
        onConfirm={handleConfirm}
        onCancel={closeDecision}
        confirmLabel={pendingDecision?.outcome === ApprovalOutcome.Approved ? "Aprovar" : "Rejeitar"}
        reasonLabel="Motivo (opcional)"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
