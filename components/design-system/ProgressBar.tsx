import type { AdminColor } from "./Button";

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: AdminColor;
  striped?: boolean;
  animated?: boolean;
  label?: string;
}

const FILL_BG: Record<AdminColor, string> = {
  primary: "bg-admin-primary",
  secondary: "bg-admin-secondary",
  success: "bg-admin-success",
  danger: "bg-admin-danger",
  warning: "bg-admin-warning",
  info: "bg-admin-info",
  light: "bg-admin-light",
  dark: "bg-admin-dark",
};

/**
 * Progress bar per design-system-admin.md §5.10 — thin track, semantic-
 * color fill, optional diagonal stripe pattern (`.admin-progress-striped`)
 * and its ~1s linear infinite sweep (`.admin-progress-animated`), both
 * defined in styles/corona-theme.css.
 */
export function ProgressBar({
  value,
  max = 100,
  color = "primary",
  striped = false,
  animated = false,
  label,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  const fillClassName = [
    "h-full",
    "rounded-full",
    FILL_BG[color],
    striped ? "admin-progress-striped" : "",
    striped && animated ? "admin-progress-animated" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-admin-border-subtle"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={fillClassName} style={{ width: `${percent}%` }} />
    </div>
  );
}
