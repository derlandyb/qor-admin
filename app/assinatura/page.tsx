"use client";

/**
 * AT32 — organizer plan/usage view (MON-17–MON-18). Change-plan/cancel are
 * P2 (MON-19–23) and have no routed qor-api endpoint yet (design.md names
 * them but api_admin_v1.php has no change-plan/cancel routes) — this page
 * is display-only until that lands.
 */
import { QuotaUsageWidget } from "../../components/design-system/QuotaUsageWidget";
import { useOrganizerSubscription } from "../../hooks/useBilling";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SubscriptionPage() {
  const { usage, loading, error } = useOrganizerSubscription();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-admin-text-primary">Assinatura</h1>

      {error && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-admin-text-secondary">Carregando...</p>
      ) : (
        usage && (
          <div className="flex flex-col gap-4 rounded-admin-default bg-admin-bg-surface p-4">
            <div>
              <p className="text-lg font-bold text-admin-text-primary">{usage.plan_name}</p>
              <p className="text-sm text-admin-text-secondary">
                {formatCurrency(usage.monthly_price)} / mês
              </p>
            </div>
            <QuotaUsageWidget usage={usage} />
          </div>
        )
      )}
    </div>
  );
}
