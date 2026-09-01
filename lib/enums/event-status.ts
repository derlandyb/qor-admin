/** Mirrors `QOR\App\Domain\Event\Enum\EventStatus` (api/src/Domain/Event/Enum/EventStatus.php). */
export const EVENT_STATUS_VALUES = [
  "draft",
  "pending_review",
  "published",
  "cancelled",
  "ended",
] as const;

export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];

/** Mirrors `QOR\App\Domain\Event\Enum\EventCreatedByType` (api/src/Domain/Event/Enum/EventCreatedByType.php). */
export const EVENT_CREATED_BY_TYPE_VALUES = ["venue_admin", "promoter"] as const;
export type EventCreatedByType = (typeof EVENT_CREATED_BY_TYPE_VALUES)[number];
