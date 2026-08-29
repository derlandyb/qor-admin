import { QuotaUsageWidget } from "./QuotaUsageWidget";
import type { UsageSummary } from "@/lib/api/types";

/**
 * Placeholder until qor-landingpage ships its plan-comparison page —
 * named/shared here (not repeated per call site) so the eventual real URL
 * only needs updating in one place.
 */
export const UPGRADE_PLAN_URL = "https://qor.app/planos";

/**
 * Informational, non-blocking at-limit notice (AT31) — quota is only
 * actually enforced by SubmitEventForReview at "Enviar para revisão"
 * time (/eventos), not at Draft create/edit time, so this never hides or
 * disables the form it's placed above.
 */
export function QuotaAtLimitBanner({ usage }: { usage: UsageSummary }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-admin-card border border-admin-danger p-4">
      <p className="text-admin-body text-admin-danger">
        Você atingiu o limite de publicações do seu plano. Para publicar novos eventos, faça upgrade do seu plano.
      </p>
      <a
        href={UPGRADE_PLAN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-admin-body font-medium text-admin-primary underline"
      >
        Ver planos disponíveis
      </a>
      <QuotaUsageWidget usage={usage} />
    </div>
  );
}
