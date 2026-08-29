/**
 * The 5-color semantic rotation used for chart/data-viz segments
 * (design-system-admin.md §1.3) — never a bespoke chart palette.
 */
export type DonutSegmentColor = "success" | "primary" | "info" | "warning" | "danger";

export interface DonutSegment {
  label: string;
  value: number;
  color: DonutSegmentColor;
}

export interface DonutWidgetProps {
  total: number | string;
  segments: DonutSegment[];
}

const SEGMENT_COLOR_VAR: Record<DonutSegmentColor, string> = {
  success: "var(--color-admin-success)",
  primary: "var(--color-admin-primary)",
  info: "var(--color-admin-info)",
  warning: "var(--color-admin-warning)",
  danger: "var(--color-admin-danger)",
};

const SEGMENT_COLOR_CLASS: Record<DonutSegmentColor, string> = {
  success: "bg-admin-success",
  primary: "bg-admin-primary",
  info: "bg-admin-info",
  warning: "bg-admin-warning",
  danger: "bg-admin-danger",
};

const RADIUS = 40;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutWidget({ total, segments }: DonutWidgetProps) {
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0);
  let offset = 0;

  return (
    <div className="rounded-admin-card bg-admin-bg-surface p-5">
      <div className="relative mx-auto h-[140px] w-[140px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="var(--color-admin-border-subtle)"
            strokeWidth={STROKE_WIDTH}
          />
          {sum > 0
            ? segments.map((segment) => {
                const fraction = segment.value / sum;
                const dashLength = fraction * CIRCUMFERENCE;
                const dashArray = `${dashLength} ${CIRCUMFERENCE - dashLength}`;
                const dashOffset = -offset;
                offset += dashLength;

                return (
                  <circle
                    key={segment.label}
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    fill="none"
                    stroke={SEGMENT_COLOR_VAR[segment.color]}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })
            : null}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-admin-h3 font-medium text-admin-text-primary">{total}</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between text-admin-body text-admin-text-secondary"
          >
            <span className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${SEGMENT_COLOR_CLASS[segment.color]}`}
                aria-hidden="true"
              />
              {segment.label}
            </span>
            <span className="text-admin-text-primary">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
