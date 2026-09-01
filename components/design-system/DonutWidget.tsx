import { SEMANTIC_COLOR_HEX, type SemanticDataColor } from "./colors";

export type DonutSegmentColor = SemanticDataColor;

export interface DonutSegment {
  label: string;
  value: number;
  color: DonutSegmentColor;
}

export interface DonutWidgetProps {
  title: string;
  total: number;
  segments: DonutSegment[];
}

const SEGMENT_BG_CLASS: Record<DonutSegmentColor, string> = {
  success: "bg-admin-success",
  primary: "bg-admin-primary",
  info: "bg-admin-info",
  warning: "bg-admin-warning",
  danger: "bg-admin-danger",
};

/**
 * design-system-admin.md §5.4 — centered total inside a segmented ring (5-color
 * semantic rotation, §1.3), itemized row list beneath. The ring is a
 * conic-gradient — no charting library needed for a single donut.
 */
export function DonutWidget({ title, total, segments }: DonutWidgetProps) {
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0);
  let cursor = 0;
  const stops = segments.map((segment) => {
    const share = sum === 0 ? 0 : segment.value / sum;
    const start = cursor;
    cursor += share * 360;
    return `${SEMANTIC_COLOR_HEX[segment.color]} ${start}deg ${cursor}deg`;
  });

  return (
    <div className="rounded-admin-default bg-admin-bg-surface p-4">
      <h3 className="text-sm font-bold text-admin-text-primary">{title}</h3>

      <div className="mt-4 flex items-center justify-center">
        <div
          role="img"
          aria-label={`${title}: total ${total}`}
          className="relative flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background:
              sum === 0
                ? "var(--color-admin-bg-body)"
                : `conic-gradient(${stops.join(", ")})`,
          }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-admin-bg-surface text-xl font-bold text-admin-text-primary">
            {total}
          </div>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-admin-text-secondary">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${SEGMENT_BG_CLASS[segment.color]}`}
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
