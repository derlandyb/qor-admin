/** Mirrors `QOR\App\Domain\Approval\Enum\ApprovalDecidableType` (api/src/Domain/Approval/Enum/ApprovalDecidableType.php). */
export const APPROVAL_DECIDABLE_TYPE_VALUES = ["venue", "promoter", "event"] as const;
export type ApprovalDecidableType = (typeof APPROVAL_DECIDABLE_TYPE_VALUES)[number];

/** Mirrors `QOR\App\Domain\Approval\Enum\ApprovalStatus` (api/src/Domain/Approval/Enum/ApprovalStatus.php). */
export const APPROVAL_STATUS_VALUES = [
  "pending_approval",
  "approved",
  "rejected",
  "suspended",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];

/** Mirrors `QOR\App\Domain\Approval\Enum\ApprovalOutcome` (api/src/Domain/Approval/Enum/ApprovalOutcome.php). */
export const APPROVAL_OUTCOME_VALUES = [
  "approved",
  "rejected",
  "suspended",
  "suspension_lifted",
  "force_cancelled",
] as const;
export type ApprovalOutcome = (typeof APPROVAL_OUTCOME_VALUES)[number];
