import { STATUS_COLOR, STATUS_LABEL, type KnownStatus, type StatusColor } from "./status";

const COLOR_CLASSES: Record<StatusColor, string> = {
  warning: "bg-admin-warning",
  success: "bg-admin-success",
  danger: "bg-admin-danger",
  info: "bg-admin-info",
  secondary: "bg-admin-secondary text-admin-dark",
};

export interface StatusPillProps {
  status: KnownStatus;
}

/** design-system-admin.md §5.6 — solid-fill badge, bg=accent color, text=white, 6px radius. */
export function StatusPill({ status }: StatusPillProps) {
  const colorClass = COLOR_CLASSES[STATUS_COLOR[status]];

  return (
    <span
      className={`inline-block rounded-admin-default px-1.5 py-1 text-xs font-medium text-white ${colorClass}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
