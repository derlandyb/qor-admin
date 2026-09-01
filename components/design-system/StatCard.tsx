export interface StatCardProps {
  value: string | number;
  label: string;
  /** Percentage-point change, e.g. 3.5 or -2.4. Omit when there's no trend to show. */
  trend?: number;
}

/**
 * design-system-admin.md §5.3 — flat card (rounded-md, --admin-bg-surface, no
 * border/shadow), 24px/700 value, small colored trend chip with a
 * directional arrow matching the trend's sign, label beneath.
 */
export function StatCard({ value, label, trend }: StatCardProps) {
  const isPositive = typeof trend === "number" && trend >= 0;

  return (
    <div className="rounded-admin-default bg-admin-bg-surface p-4">
      <div className="flex items-start justify-between">
        <p className="text-2xl font-bold text-admin-text-primary">{value}</p>
        {typeof trend === "number" && (
          <span
            className={`flex items-center gap-1 rounded-admin-default px-2 py-1 text-xs font-medium text-white ${
              isPositive ? "bg-admin-success" : "bg-admin-danger"
            }`}
          >
            <span aria-hidden>{isPositive ? "▲" : "▼"}</span>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-admin-text-secondary">{label}</p>
    </div>
  );
}
