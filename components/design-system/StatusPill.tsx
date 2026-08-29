import { ApprovalStatus, EventStatus } from "@/lib/enums";

/**
 * Any status value StatusPill can render: the ApprovalStatus union
 * (venue/promoter/account approval queue) or the EventStatus union
 * (event lifecycle). Never a raw string — color is always derived from
 * this enum value via STATUS_PILL_CONFIG below (design-system-admin.md §1.2/§5.6).
 */
export type StatusPillStatus = ApprovalStatus | EventStatus;

type StatusPillColor = "success" | "warning" | "danger" | "info";

interface StatusPillConfig {
  color: StatusPillColor;
  label: string;
}

/**
 * Enum value -> { semantic color, pt-BR label } map (design-system-admin.md
 * §1.2/§5.6). This is the single source of truth for status -> color; never
 * branch on the raw string at a call site.
 */
const STATUS_PILL_CONFIG: Record<StatusPillStatus, StatusPillConfig> = {
  [ApprovalStatus.PendingApproval]: { color: "warning", label: "Pendente" },
  [ApprovalStatus.Approved]: { color: "success", label: "Aprovado" },
  [ApprovalStatus.Rejected]: { color: "danger", label: "Rejeitado" },
  [ApprovalStatus.Suspended]: { color: "danger", label: "Suspenso" },
  [EventStatus.Draft]: { color: "warning", label: "Rascunho" },
  [EventStatus.PendingReview]: { color: "warning", label: "Em análise" },
  [EventStatus.Published]: { color: "success", label: "Publicado" },
  [EventStatus.Cancelled]: { color: "danger", label: "Cancelado" },
  [EventStatus.Ended]: { color: "info", label: "Encerrado" },
};

const COLOR_CLASS: Record<StatusPillColor, string> = {
  success: "bg-admin-success",
  warning: "bg-admin-warning",
  danger: "bg-admin-danger",
  info: "bg-admin-info",
};

export interface StatusPillProps {
  status: StatusPillStatus;
  label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const config = STATUS_PILL_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-admin-badge px-[6px] py-[4px] text-[12px] font-medium text-white ${COLOR_CLASS[config.color]}`}
    >
      {label ?? config.label}
    </span>
  );
}
