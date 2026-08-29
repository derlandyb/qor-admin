export interface StatCardTrend {
  value: string;
  direction: "up" | "down";
}

export interface StatCardProps {
  value: string | number;
  label: string;
  trend?: StatCardTrend;
}

function UpRightArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownRightArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M7 7L17 17M17 17H9M17 17V9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({ value, label, trend }: StatCardProps) {
  const trendColorClass =
    trend?.direction === "up" ? "bg-admin-success" : "bg-admin-danger";

  return (
    <div className="relative rounded-admin-card bg-admin-bg-surface p-5">
      <button
        type="button"
        aria-label={trend?.direction === "up" ? "Tendência de alta" : "Tendência de baixa"}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-admin-bg-surface-alt text-admin-text-primary transition-colors duration-admin-control ease-admin-control"
      >
        {trend?.direction === "down" ? <DownRightArrowIcon /> : <UpRightArrowIcon />}
      </button>

      <p className="text-admin-h2 font-medium text-admin-text-primary">{value}</p>

      {trend ? (
        <span
          className={`mt-2 inline-flex items-center rounded-admin-badge px-[6px] py-[4px] text-[12px] font-medium text-white ${trendColorClass}`}
        >
          {trend.value}
        </span>
      ) : null}

      <p className="mt-2 text-admin-body text-admin-text-secondary">{label}</p>
    </div>
  );
}
