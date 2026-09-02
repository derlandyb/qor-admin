/**
 * design-system-admin.md §1.2 — QOR status -> Corona semantic color mapping.
 * Covers every value api emits across ApprovalStatus, ApprovalOutcome, and
 * EventStatus (api/src/Domain/{Approval,Event}/Enum/*.php) so StatusPill
 * never derives color from a raw string at the call site.
 */
export type StatusColor = "warning" | "success" | "danger" | "info" | "secondary";

export type KnownStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "suspended"
  | "suspension_lifted"
  | "force_cancelled"
  | "draft"
  | "pending_review"
  | "published"
  | "cancelled"
  | "ended"
  | "active"
  | "inactive";

export const STATUS_COLOR: Record<KnownStatus, StatusColor> = {
  draft: "warning",
  pending_approval: "warning",
  pending_review: "warning",
  published: "success",
  approved: "success",
  suspension_lifted: "success",
  active: "success",
  rejected: "danger",
  suspended: "danger",
  cancelled: "danger",
  force_cancelled: "danger",
  ended: "info",
  inactive: "secondary",
};

export const STATUS_LABEL: Record<KnownStatus, string> = {
  draft: "Rascunho",
  pending_approval: "Pendente",
  pending_review: "Em Revisão",
  published: "Publicado",
  approved: "Aprovado",
  suspension_lifted: "Suspensão Removida",
  active: "Ativo",
  rejected: "Rejeitado",
  suspended: "Suspenso",
  cancelled: "Cancelado",
  force_cancelled: "Cancelado",
  ended: "Encerrado",
  inactive: "Inativo",
};
