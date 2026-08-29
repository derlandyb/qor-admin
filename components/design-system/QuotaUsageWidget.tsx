import type { UsageSummary } from "@/lib/api/types";
import { ProgressBar } from "./ProgressBar";

export interface QuotaUsageWidgetProps {
  usage: UsageSummary;
}

/**
 * "X de Y publicações usadas este mês" quota widget (AT29) — reuses
 * ProgressBar for the visual fill, per design-system-admin.md §5.10.
 * Unlimited plans (`publish_quota === null`) skip the bar entirely, since
 * a 0%-denominator progress bar is meaningless.
 */
export function QuotaUsageWidget({ usage }: QuotaUsageWidgetProps) {
  const { publish_quota, publishes_used_this_period, is_at_limit } = usage;
  const isUnlimited = publish_quota === null;

  const label = isUnlimited
    ? `${publishes_used_this_period} publicações usadas este mês (sem limite)`
    : `${publishes_used_this_period} de ${publish_quota} publicações usadas este mês`;

  return (
    <div className="rounded-admin-card bg-admin-bg-surface p-5">
      <p className="text-admin-body text-admin-text-primary">{label}</p>

      {!isUnlimited && (
        <div className="mt-3">
          <ProgressBar
            value={publishes_used_this_period}
            max={publish_quota}
            color={is_at_limit ? "danger" : "primary"}
            label={label}
          />
        </div>
      )}

      {is_at_limit && (
        <p className="mt-2 text-admin-body text-admin-danger">
          Limite de publicações atingido.
        </p>
      )}
    </div>
  );
}
