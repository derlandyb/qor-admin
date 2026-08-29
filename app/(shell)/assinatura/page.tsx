"use client";

import { QuotaUsageWidget } from "@/components/design-system/QuotaUsageWidget";
import { useOrganizerSubscription } from "@/hooks/useBilling";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMonthlyPrice(monthlyPrice: number): string {
  return CURRENCY_FORMATTER.format(monthlyPrice);
}

/**
 * MON-17–MON-18/AT32: read-only view of the organizer's current plan usage
 * — plan name, monthly price, and QuotaUsageWidget. Change-plan picker and
 * cancel action are deferred to a future Monetization P2 pass (MON-19–23).
 */
export default function AssinaturaPage() {
  const { usage, isLoading, error } = useOrganizerSubscription();

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-admin-h3 font-medium text-admin-text-primary">Assinatura</h1>

      {isLoading ? (
        <p className="text-admin-text-secondary">Carregando...</p>
      ) : error ? (
        <p role="alert" className="text-admin-danger">
          {error}
        </p>
      ) : usage ? (
        <>
          <div className="rounded-admin-card bg-admin-bg-surface p-5">
            <p className="text-admin-body text-admin-text-primary">Plano: {usage.plan_name}</p>
            <p className="text-admin-body text-admin-text-primary">
              Valor mensal: {formatMonthlyPrice(usage.monthly_price)}
            </p>
          </div>

          <QuotaUsageWidget usage={usage} />
        </>
      ) : null}
    </div>
  );
}
