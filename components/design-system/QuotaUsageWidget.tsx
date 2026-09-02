import { ProgressBar } from "./ProgressBar";
import type { UsageSummary } from "../../lib/api/types";

export interface QuotaUsageWidgetProps {
  usage: UsageSummary;
  /** Cross-repo external link to qor-landingpage's plan comparison page — not an in-app route. */
  upgradeHref?: string;
}

/**
 * design-system-admin.md §5.10's "cheap to build now" QOR mapping: publish
 * quota usage via ProgressBar's outer-label variant, danger-colored and
 * flagged when at-limit (MON-17/MON-18).
 */
export function QuotaUsageWidget({ usage, upgradeHref }: QuotaUsageWidgetProps) {
  if (usage.publish_quota === null) {
    return <p className="text-sm text-admin-text-secondary">Publicações ilimitadas.</p>;
  }

  const pct =
    usage.publish_quota > 0 ? (usage.publishes_used_this_period / usage.publish_quota) * 100 : 100;

  return (
    <div className="flex flex-col gap-2">
      <ProgressBar
        variant="outer-label"
        color={usage.is_at_limit ? "danger" : "primary"}
        value={pct}
        label={`${usage.publishes_used_this_period} de ${usage.publish_quota} publicações usadas este mês`}
      />
      {usage.is_at_limit && (
        <p role="alert" className="rounded-admin-default bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
          Você atingiu o limite de publicações do seu plano
          {upgradeHref && (
            <>
              {" — "}
              <a href={upgradeHref} className="underline">
                Fazer upgrade
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
