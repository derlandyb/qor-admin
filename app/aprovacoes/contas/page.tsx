"use client";

/**
 * AT16 — Super Admin account-approval queue (ADMIN-07–ADMIN-10). Lists every
 * `pending_approval` Venue/Promoter with the details they submitted and lets
 * a Super Admin approve/reject with an optional reason, auditable via the
 * api's decide-approval endpoint (which persists an ApprovalDecision row).
 * Role-gating is useSession()/AT22's job (layout wiring), not this page's —
 * this page assumes it is only ever reached by an authorized Super Admin.
 */
import { useState } from "react";
import { DataTable, type DataTableColumn } from "../../../components/design-system/DataTable";
import { DecisionModal } from "../../../components/design-system/DecisionModal";
import { useAccountApprovalQueue } from "../../../hooks/useApprovalQueues";
import type { PendingAccount } from "../../../lib/api/types";
import type { ApprovalOutcome } from "../../../lib/enums/approval";

const TYPE_LABEL: Record<PendingAccount["type"], string> = {
  venue: "Casa de Show",
  promoter: "Produtora",
};

interface PendingDecision {
  account: PendingAccount;
  outcome: ApprovalOutcome;
}

export default function AccountApprovalsPage() {
  const { accounts, loading, error, page, totalPages, decide, setPage } =
    useAccountApprovalQueue();
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const columns: DataTableColumn<PendingAccount>[] = [
    { key: "name", header: "Nome", render: (row) => row.name },
    { key: "type", header: "Tipo", render: (row) => TYPE_LABEL[row.type] },
    { key: "contact_email", header: "E-mail", render: (row) => row.contact_email },
    { key: "contact_phone", header: "Telefone", render: (row) => row.contact_phone },
  ];

  function requestDecision(account: PendingAccount, outcome: ApprovalOutcome) {
    setPendingDecision({ account, outcome });
  }

  async function handleConfirm(reason: string | null) {
    if (!pendingDecision) return;
    const { account, outcome } = pendingDecision;
    setPendingDecision(null);
    await decide(account.type, account.id, { outcome, reason });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-admin-text-primary">
          Aprovação de Contas
        </h1>
        <p className="mt-1 text-sm text-admin-text-secondary">
          Analise as casas de show e produtoras pendentes de aprovação.
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
            rows={accounts}
            rowKey={(row) => `${row.type}-${row.id}`}
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
            ? `Aprovar ${pendingDecision.account.name}?`
            : `Rejeitar ${pendingDecision?.account.name ?? ""}?`
        }
        onConfirm={handleConfirm}
        onCancel={() => setPendingDecision(null)}
      />
    </div>
  );
}
