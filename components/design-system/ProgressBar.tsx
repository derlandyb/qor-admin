import { SEMANTIC_COLOR_HEX, type SemanticDataColor } from "./colors";

export type ProgressBarColor = SemanticDataColor;
export type ProgressBarVariant = "plain" | "inner-label" | "outer-label" | "circular";

export interface ProgressBarProps {
  /** 0-100. Values outside that range are clamped. */
  value: number;
  color?: ProgressBarColor;
  variant?: ProgressBarVariant;
  label?: string;
}

const FILL_CLASS: Record<ProgressBarColor, string> = {
  success: "bg-admin-success",
  primary: "bg-admin-primary",
  info: "bg-admin-info",
  warning: "bg-admin-warning",
  danger: "bg-admin-danger",
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * design-system-admin.md §5.10 — thin dark track, one of the 5 semantic
 * fill colors, plain/inner-label/outer-label/circular variants. QOR mapping:
 * publish-quota usage ("3 de 5 publicações usadas este mês").
 */
export function ProgressBar({ value, color = "primary", variant = "plain", label }: ProgressBarProps) {
  const pct = clamp(value);

  if (variant === "circular") {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct / 100);

    return (
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="relative inline-flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-admin-bg-body)" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={SEMANTIC_COLOR_HEX[color]}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-sm font-bold text-admin-text-primary">{pct}%</span>
      </div>
    );
  }

  return (
    <div>
      {variant === "outer-label" && (
        <div className="mb-1 flex items-center justify-between text-xs text-admin-text-secondary">
          {label && <span>{label}</span>}
          <span>{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-admin-pill bg-admin-bg-body"
      >
        <div
          className={`flex h-full items-center justify-center ${FILL_CLASS[color]}`}
          style={{ width: `${pct}%` }}
        >
          {variant === "inner-label" && pct > 10 && (
            <span className="text-[10px] font-medium text-white">{pct}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
